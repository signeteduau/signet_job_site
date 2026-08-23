#!/usr/bin/env bash
# Run on VPS as root: bash vps-deploy.sh
# Hestia user: user | Domain: signetemploymenthub.com

set -euo pipefail

HESTIA_USER="user"
DOMAIN="signetemploymenthub.com"
APP_DIR="/home/${HESTIA_USER}/apps/signet"
REPO="https://github.com/signeteduau/signet_job_site.git"
PORT="3000"
PM2_NAME="signet"

echo "==> Installing git (if needed)..."
if ! command -v git &>/dev/null; then
  apt-get update -qq
  apt-get install -y git
fi

echo "==> Installing Node.js 20 (if needed)..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

echo "==> Installing PM2 (if needed)..."
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

echo "==> Cloning/updating app..."
mkdir -p "/home/${HESTIA_USER}/apps"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

if [ ! -f "$APP_DIR/.env.local" ]; then
  cat > "$APP_DIR/.env.local" << 'ENVEOF'
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCvm70luWkiPWe46eErtkLZsQzf0sgQgpI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=job-portal-app-72db3.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=job-portal-app-72db3
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=job-portal-app-72db3.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1028801677157
NEXT_PUBLIC_FIREBASE_APP_ID=1:1028801677157:web:a9870032fc4791c3b0438c
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-X0WTWEBKDQ
ENVEOF
  echo "Created $APP_DIR/.env.local"
fi

echo "==> Installing dependencies and building..."
npm ci || npm install
npm run build

echo "==> Starting/restarting PM2..."
pm2 delete "$PM2_NAME" 2>/dev/null || true
cd "$APP_DIR"
pm2 start npm --name "$PM2_NAME" -- start
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "==> Configuring Nginx reverse proxy for ${DOMAIN}..."
NGINX_SSL_CUSTOM="/home/${HESTIA_USER}/conf/web/${DOMAIN}/nginx.ssl.conf_custom"
NGINX_CUSTOM="/home/${HESTIA_USER}/conf/web/${DOMAIN}/nginx.conf_custom"
mkdir -p "/home/${HESTIA_USER}/conf/web/${DOMAIN}"

PROXY_BLOCK="location / {
    proxy_pass http://127.0.0.1:${PORT};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
}"

echo "$PROXY_BLOCK" > "$NGINX_SSL_CUSTOM"
echo "$PROXY_BLOCK" > "$NGINX_CUSTOM"
chown "${HESTIA_USER}:${HESTIA_USER}" "$NGINX_SSL_CUSTOM" "$NGINX_CUSTOM"

if command -v v-rebuild-web-domain &>/dev/null; then
  v-rebuild-web-domain "$HESTIA_USER" "$DOMAIN"
else
  systemctl reload nginx
fi

echo ""
echo "Done! Test locally:  curl -I http://127.0.0.1:${PORT}"
echo "Live site:           https://${DOMAIN}"
echo "PM2 status:          pm2 status"
echo "PM2 logs:            pm2 logs ${PM2_NAME}"
