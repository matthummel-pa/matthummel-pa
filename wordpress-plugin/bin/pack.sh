#!/usr/bin/env bash
# Pack Branchborne Gem Quest into a WordPress-installable zip.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${ROOT}/dist"
VERSION="$(grep -E '^ \* Version:' "${ROOT}/git-blocks.php" | awk '{print $3}')"
NAME="git-blocks"
ZIP="${DIST}/${NAME}-${VERSION}.zip"
STAGE="${DIST}/stage"

rm -rf "${STAGE}" "${ZIP}"
mkdir -p "${STAGE}/${NAME}" "${DIST}"

# Copy plugin files (no rsync dependency).
shopt -s dotglob nullglob
for item in "${ROOT}"/*; do
  base="$(basename "${item}")"
  case "${base}" in
    dist|bin|README.md) continue ;;
  esac
  cp -a "${item}" "${STAGE}/${NAME}/"
done
shopt -u dotglob nullglob

rm -rf "${STAGE}/${NAME}/dist" "${STAGE}/${NAME}/bin"

(
  cd "${STAGE}"
  zip -r "${ZIP}" "${NAME}" >/dev/null
)

rm -rf "${STAGE}"
echo "Packed ${ZIP}"
unzip -l "${ZIP}" | head -40
