#!/usr/bin/env bash
# Push this tree to matthummel-pa/branchborne-gem-quest-game and print Pages URL.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${1:-https://github.com/matthummel-pa/branchborne-gem-quest-game.git}"
cd "$ROOT"
# Keep docs in sync with play before publish
rm -rf docs && mkdir docs && cp -a play/. docs/ && touch docs/.nojekyll
git add -A
git diff --cached --quiet || git commit -m "chore: sync docs for Pages"
git push --force "$REMOTE" HEAD:main
echo "Pushed to $REMOTE"
echo "Then: Settings → Pages → GitHub Actions"
echo "Hit page: https://matthummel-pa.github.io/branchborne-gem-quest-game/"
