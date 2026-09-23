#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
AUTH_ARGS=()
if [ -n "${NETLIFY_AUTH_TOKEN:-}" ]; then
  AUTH_ARGS+=(--auth "$NETLIFY_AUTH_TOKEN")
fi
SITE_NAME="${NETLIFY_SITE_NAME:-branchborne-gem-quest}"
SUPABASE_URL="${SUPABASE_URL:-https://noxzzvbmcckzmaohyahe.supabase.co}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY required}"
npm run sync:docs
if [ ! -f .netlify/state.json ]; then
  npx --yes netlify-cli sites:create --name "$SITE_NAME" "${AUTH_ARGS[@]}" || true
  npx --yes netlify-cli link --name "$SITE_NAME" "${AUTH_ARGS[@]}" || true
fi
npx --yes netlify-cli env:set SUPABASE_URL "$SUPABASE_URL" "${AUTH_ARGS[@]}"
npx --yes netlify-cli env:set SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY" "${AUTH_ARGS[@]}"
npx --yes netlify-cli deploy --prod --dir=play "${AUTH_ARGS[@]}"
