#!/usr/bin/env bash
# Quick redeploy on VPS after pushing to main.
#
# Run on the VPS:
#   cd /home/user/apps/signet && bash scripts/vps-redeploy.sh
#
# Or from your machine over SSH:
#   ssh user@187.52.119.138 'cd /home/user/apps/signet && bash scripts/vps-redeploy.sh'

set -euo pipefail

HESTIA_USER="${HESTIA_USER:-user}"
APP_DIR="${APP_DIR:-/home/${HESTIA_USER}/apps/signet}"
PM2_NAME="${PM2_NAME:-signet}"
BRANCH="${BRANCH:-main}"
DOMAIN="${DOMAIN:-signetemploymenthub.com}"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Error: $APP_DIR is not a git repo. Run scripts/vps-deploy.sh for first-time setup."
  exit 1
fi

echo "==> Redeploying Signet from origin/${BRANCH}..."
cd "$APP_DIR"

echo "==> Fetching latest code..."
git fetch origin "$BRANCH"
git reset --hard "origin/${BRANCH}"

echo "==> Installing dependencies..."
npm ci

echo "==> Building..."
npm run build

echo "==> Restarting PM2 (${PM2_NAME})..."
if pm2 describe "$PM2_NAME" &>/dev/null; then
  pm2 restart "$PM2_NAME"
else
  pm2 start npm --name "$PM2_NAME" -- start
fi
pm2 save

echo ""
echo "Redeploy complete."
echo "  Local:  curl -I http://127.0.0.1:3000"
echo "  Live:   https://${DOMAIN}"
echo "  Logs:   pm2 logs ${PM2_NAME}"
