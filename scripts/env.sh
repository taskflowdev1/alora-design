# Sourced by every job script (verify, shots, landing-shots, flap-shots, v33-shots) so they run on Yoga or, with
# `--needs mac --sync`, on the Mac from a frozen copy that has no node_modules. Node 24 via nvm; npm ci when deps are
# missing or stale; the Playwright headless shell + ffmpeg when missing. npm and Playwright caches live under $HOME,
# so repeat runs are quick.
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  set +eu
  . "$HOME/.nvm/nvm.sh" >/dev/null
  nvm use --silent 24 >/dev/null 2>&1
  set -eu
fi
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  echo "== npm ci ($(uname -s))"
  npm ci --prefer-offline --no-audit --no-fund --loglevel=error
fi
if [ "${NEEDS_BROWSER:-1}" = 1 ]; then
  npx playwright-core install chromium-headless-shell ffmpeg 2>&1 | grep -v -E '^\s*$|\|' || true
fi
