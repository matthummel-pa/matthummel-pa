import { createClient } from "@supabase/supabase-js";
import type { Config, Context } from "@netlify/functions";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "Content-Type, X-Player-Id",
      "access-control-allow-methods": "GET, POST, OPTIONS",
    },
  });
}

function getSupabase() {
  const url = Netlify.env.get("SUPABASE_URL") || process.env.SUPABASE_URL;
  const key =
    Netlify.env.get("SUPABASE_ANON_KEY") ||
    process.env.SUPABASE_ANON_KEY ||
    Netlify.env.get("SUPABASE_PUBLISHABLE_KEY") ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function playerIdFrom(req: Request, body?: { playerId?: string }) {
  const header = req.headers.get("x-player-id") || "";
  const id = (body?.playerId || header || "").trim();
  if (!UUID_RE.test(id)) return null;
  return id.toLowerCase();
}

function mergeMap(
  current: Record<string, unknown> | null | undefined,
  incoming: Record<string, unknown> | null | undefined
) {
  return { ...(current || {}), ...(incoming || {}) };
}

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 500);
  }

  if (req.method === "GET") {
    const playerId = playerIdFrom(req);
    if (!playerId) return json({ ok: false, error: "Valid X-Player-Id UUID required" }, 400);
    const { data, error } = await supabase
      .from("branchborne_players")
      .select("player_id, high_score, pathway_id, trophies, items, updated_at")
      .eq("player_id", playerId)
      .maybeSingle();
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, save: data });
  }

  if (req.method === "POST") {
    let body: {
      playerId?: string;
      highScore?: number;
      pathwayId?: string | null;
      trophies?: Record<string, unknown>;
      items?: Record<string, unknown>;
    };
    try {
      body = await req.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON body" }, 400);
    }
    const playerId = playerIdFrom(req, body);
    if (!playerId) return json({ ok: false, error: "Valid playerId UUID required" }, 400);

    const { data: existing } = await supabase
      .from("branchborne_players")
      .select("high_score, trophies, items, pathway_id")
      .eq("player_id", playerId)
      .maybeSingle();

    const highScore = Math.max(
      Number(existing?.high_score || 0),
      Math.max(0, Math.floor(Number(body.highScore) || 0))
    );
    const trophies = mergeMap(
      (existing?.trophies as Record<string, unknown>) || {},
      body.trophies || {}
    );
    const items = mergeMap((existing?.items as Record<string, unknown>) || {}, body.items || {});
    const pathwayId = body.pathwayId || existing?.pathway_id || null;

    const row = {
      player_id: playerId,
      high_score: highScore,
      pathway_id: pathwayId,
      trophies,
      items,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("branchborne_players")
      .upsert(row, { onConflict: "player_id" })
      .select("player_id, high_score, pathway_id, trophies, items, updated_at")
      .single();

    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, save: data });
  }

  return json({ ok: false, error: "Method not allowed" }, 405);
};

export const config: Config = {
  path: "/api/trophies",
};
