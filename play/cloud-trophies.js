/**
 * Branchborne cloud trophies — Netlify /api/trophies → Supabase branchborne_players
 */
(function (global) {
  "use strict";

  const PLAYER_KEY = "branchborne-player-id-v1";
  const API = "/api/trophies";

  function uuid() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getPlayerId() {
    try {
      let id = localStorage.getItem(PLAYER_KEY);
      if (!id) {
        id = uuid();
        localStorage.setItem(PLAYER_KEY, id);
      }
      return id;
    } catch (_err) {
      return uuid();
    }
  }

  async function fetchSave(playerId) {
    const res = await fetch(API, {
      method: "GET",
      headers: { "X-Player-Id": playerId },
    });
    if (!res.ok) throw new Error("trophy load failed: " + res.status);
    return res.json();
  }

  async function pushSave(playerId, payload) {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Player-Id": playerId,
      },
      body: JSON.stringify({ playerId, ...payload }),
    });
    if (!res.ok) throw new Error("trophy save failed: " + res.status);
    return res.json();
  }

  
  function setStatus(text) {
    document.querySelectorAll("[data-cloud-status]").forEach((el) => {
      el.textContent = text;
    });
  }

  function attach(game, root) {
    if (!game || typeof game.applyCloudSave !== "function") return;
    const playerId = getPlayerId();
    root.dataset.playerId = playerId;
    let syncTimer = null;
    let lastSig = "";

    function signature() {
      const snap = game.snapshot();
      const t = (snap.trophyCatalog || []).filter((x) => x.owned).map((x) => x.id).sort().join(",");
      const i = (snap.itemCatalog || []).filter((x) => x.owned).map((x) => x.id).sort().join(",");
      return `${snap.score || 0}|${t}|${i}|${snap.pathwayId || ""}`;
    }

    async function load() {
      try {
        const result = await fetchSave(playerId);
        if (result && result.ok && result.save) {
          game.applyCloudSave(result.save);
          if (typeof result.save.high_score === "number") {
            try {
              const localHigh = Number(localStorage.getItem("git-blocks-high-score") || 0);
              if (result.save.high_score > localHigh) {
                localStorage.setItem("git-blocks-high-score", String(result.save.high_score));
              }
            } catch (_e) {}
          }
          root.dispatchEvent(new CustomEvent("branchborne:cloud-loaded", { detail: result.save }));
          setStatus("Cloud trophies synced · player " + playerId.slice(0, 8));
        }
      } catch (err) {
        console.warn("[branchborne] cloud load skipped", err.message || err);
        setStatus("Cloud trophies offline (local only)");
      }
    }

    async function save(force) {
      const sig = signature();
      if (!force && sig === lastSig) return;
      lastSig = sig;
      try {
        const payload = game.exportCloudSave();
        // Prefer best LOC for cloud high score
        try {
          payload.highScore = Math.max(
            payload.highScore || 0,
            Number(localStorage.getItem("git-blocks-high-score") || 0)
          );
        } catch (_e) {}
        const result = await pushSave(playerId, payload);
        if (result && result.ok) {
          root.dispatchEvent(new CustomEvent("branchborne:cloud-saved", { detail: result.save }));
          setStatus("Cloud trophies saved · " + Object.keys((result.save && result.save.trophies) || {}).length + " earned");
        }
      } catch (err) {
        console.warn("[branchborne] cloud save skipped", err.message || err);
      }
    }

    function scheduleSave() {
      window.clearTimeout(syncTimer);
      syncTimer = window.setTimeout(() => save(false), 900);
    }

    load().then(() => save(true));
    root.addEventListener("branchborne:progress", scheduleSave);
    // Periodic soft sync while playing
    const tick = window.setInterval(() => {
      if (game.status === "playing" || game.status === "paused") scheduleSave();
    }, 15000);

    return {
      playerId,
      save: () => save(true),
      load,
      destroy() {
        window.clearTimeout(syncTimer);
        window.clearInterval(tick);
      },
    };
  }

  // Wrap boot to attach cloud sync after each cabinet boots
  function install() {
    const api = global.Branchborne || global.GitBlocks;
    if (!api || typeof api.boot !== "function" || api._cloudTrophiesInstalled) return;
    api._cloudTrophiesInstalled = true;
    const original = api.boot.bind(api);
    api.boot = function cloudBoot(root, options) {
      const game = original(root, options);
      try {
        const cloud = attach(game, root);
        root._branchborneCloud = cloud;
        // Hook draw-side trophy events via MutationObserver-less polling of pending is heavy;
        // expose manual nudge used by patched draw if present.
        const prev = root._onBranchborneProgress;
        root._onBranchborneProgress = function () {
          if (typeof prev === "function") prev();
          if (cloud) cloud.save();
        };
      } catch (err) {
        console.warn("[branchborne] cloud attach failed", err);
      }
      return game;
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }

  global.BranchborneCloud = { getPlayerId, attach, install };
})(typeof globalThis !== "undefined" ? globalThis : window);
