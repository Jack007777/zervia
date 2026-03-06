# Zervia API Production Deployment (Hetzner VPS, Ubuntu 22.04)

## 1) Prerequisites on VPS

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release cron
```

Install Docker + Compose plugin:

```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Re-login once after adding Docker group.

## 2) Environment variables

Create API env:

```bash
cp apps/api/.env.example apps/api/.env
```

Required variables:

- `JWT_SECRET`
- `REFRESH_SECRET`
- `MONGO_URI`
- `CORS_ORIGINS`
- `BASE_URL`

## 3) Bring up API + Nginx

```bash
docker compose build
docker compose up -d
```

## 4) Let's Encrypt certificate (Certbot)

Stop nginx in compose once for first issuance:

```bash
docker compose stop nginx
sudo apt install -y certbot
sudo certbot certonly --standalone -d api.zervia.eu -m admin@zervia.eu --agree-tos --no-eff-email
```

Copy certs into compose-mounted path:

```bash
sudo mkdir -p deploy/certbot/conf
sudo rsync -a /etc/letsencrypt/ deploy/certbot/conf/
```

Start nginx again:

```bash
docker compose up -d nginx
```

## 5) Certificate renewal

Create renewal script `/usr/local/bin/zervia-cert-renew.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
certbot renew --quiet --post-hook "rsync -a /etc/letsencrypt/ /opt/zervia/deploy/certbot/conf/ && cd /opt/zervia && docker compose restart nginx"
```

Make executable:

```bash
sudo chmod +x /usr/local/bin/zervia-cert-renew.sh
```

Cron example (`crontab -e`):

```cron
15 3 * * * /usr/local/bin/zervia-cert-renew.sh >> /var/log/zervia-cert-renew.log 2>&1
```

## 6) Frontend PWA deployment options

### Option A: Cloudflare Pages (recommended)

1. Push repo to GitHub.
2. Create project in Cloudflare Pages.
3. Build settings:
   - Framework preset: `Next.js`
   - Build command: `corepack pnpm --filter @zervia/web build`
   - Output: `.next`
4. Set env var: `NEXT_PUBLIC_API_BASE_URL=https://api.zervia.eu/api/v1`
5. Bind domain `zervia.eu`.
6. Keep API domain CORS whitelist updated.

### Option B: Nginx static hosting on VPS

1. Build web app:
   ```bash
   corepack pnpm --filter @zervia/web build
   corepack pnpm --filter @zervia/web start
   ```
2. For pure static export you must adapt app to static-only constraints; otherwise run Next.js server behind nginx.
3. Add another Nginx server block for `zervia.eu` and proxy to web container/service.
4. Keep `api.zervia.eu` and `zervia.eu` certificates managed via certbot.

## 7) Quick troubleshooting (API startup + CORS)

If business dashboard actions fail with browser `CORS` errors:

1. Check API container health:

```bash
docker compose ps
docker compose logs --tail=100 api
curl -i http://127.0.0.1:4100/api/v1/health
```

2. Check preflight response:

```bash
curl -i -X OPTIONS "https://api.zervia.eu/api/v1/business" \
  -H "Origin: https://www.zervia.eu" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization"
```

Expected result: `204` or `200` with `Access-Control-Allow-Origin`.
