# VibeGrid — VPS Topology & Production Deployment Guide

## 1. Overview

This document defines the production topology for deploying VibeGrid on a Virtual Private Server (VPS). The deployment leverages a two-tier proxy architecture:

1. **Host Nginx Proxy + Certbot SSL**: Handles public TLS termination (`443`), domain routing, and proxies traffic into local container ports.
2. **Container Gateway (Nginx API Gateway)**: Handles internal microservice routing (`/api/auth`, `/api/media`, `/api/realtime`), JWT `auth_request` subrequests, and rate-limiting headers.

---

## 2. Network & Port Architecture

```text
                                  ┌─────────────────────────┐
                                  │      Public Client      │
                                  └────────────┬────────────┘
                                               │
                                      HTTPS (443) / HTTP (80)
                                               │
                                  ┌────────────▼────────────┐
                                  │    Host Nginx + SSL     │
                                  └──────┬───────────┬──────┘
                                         │           │
                     https://vibegrid.com│           │https://api.vibegrid.com
                                         │           │
                            ┌────────────▼──┐     ┌──▼────────────┐
                            │ Next.js BFF   │     │ API Gateway   │
                            │ (Port 3000)   │     │ (Port 8000)   │
                            └───────────────┘     └──┬────────────┘
                                                     │
               ┌───────────────────────┬─────────────┼───────────────┬───────────────────────┐
               │                       │             │               │                       │
      ┌────────▼────────┐     ┌────────▼──────┐  ┌───▼───────────┐ ┌─▼─────────────┐   ┌───▼───────────┐
      │ Auth Service    │     │ Media Service │  │ Realtime Gateway │ Email Service │   │ Onboarding W. │
      │ (Port 8001)     │     │ (Port 3002)   │  │ (Port 8005)   │ │ (Port 8003)   │   │ (Port 8004)   │
      └─────────────────┘     └───────────────┘  └───────────────┘ └───────────────┘   └───────────────┘
```

### Verified Port Matrix

| Service / Container | Host Port | Internal Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Host Nginx** | 80, 443 | 80, 443 | HTTP/HTTPS | Ingress & TLS Termination |
| **Next.js BFF (`vibegrid-bff`)** | 3000 | 3000 | HTTP | Next.js Server & React App |
| **API Gateway (`vibegrid-gateway`)** | 8000 | 8000 | HTTP | Service Gateway & `auth_request` |
| **Auth Service (`vibegrid-auth`)** | 8001 | 8001 | HTTP | Identity, JWT & Refresh Tokens |
| **Media Service (`vibegrid-media`)** | 8002 | 3002 | HTTP | Presigned URLs & Upload Verification |
| **Email Service (`vibegrid-email`)** | 8003 | 8003 | HTTP | Transactional Mail Worker |
| **Onboarding Worker (`vibegrid-onboarding`)** | 8004 | 8004 | HTTP | Background Onboarding Pipeline |
| **Realtime Gateway (`vibegrid-realtime`)** | 8005 | 8005 | HTTP / WS | Socket.IO & Pub/Sub Client Sync |
| **PostgreSQL (`vibegrid-postgres`)** | 5432 | 5432 | TCP | Relational DB (Auth & Social) |
| **MongoDB (`vibegrid-mongodb`)** | 27017 | 27017 | TCP | Document Store (Feeds & Analytics) |
| **Redis (`vibegrid-redis`)** | 6379 | 6379 | TCP | Cache, Rate Limits & Pub/Sub |
| **RabbitMQ (`vibegrid-rabbitmq`)** | 5672 / 15672 | 5672 / 15672 | AMQP / HTTP | Async Message Broker & AMQP UI |
| **MinIO (`vibegrid-minio`)** | 9000 / 9001 | 9000 / 9001 | S3 / HTTP | Object Storage (Media & Logs) |

---

## 3. Host Nginx & SSL Configuration

### Sample `/etc/nginx/sites-available/vibegrid.conf`

```nginx
# 1. HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name vibegrid.com www.vibegrid.com api.vibegrid.com;
    return 301 https://$host$request_uri;
}

# 2. Frontend & BFF Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name vibegrid.com www.vibegrid.com;

    ssl_certificate /etc/letsencrypt/live/vibegrid.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vibegrid.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 3. API Gateway & WebSocket Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.vibegrid.com;

    ssl_certificate /etc/letsencrypt/live/vibegrid.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vibegrid.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    # Realtime Gateway WebSockets
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Microservice API Gateway
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. MinIO Object Storage & Log Archival

MinIO runs in production with strict bucket separation:

1. **`vibegrid-media`**: Public/presigned image and video uploads.
2. **`vibegrid-logs`**: Immutable structured log archive (`logs/<service>/YYYY/MM/DD/`).

Log archival is managed asynchronously by `LogArchiveWorker` scanning local daily rotated log files (`pino-roll`) and uploading them safely without blocking primary services.

---

## 5. Health Monitoring Cron Setup

Add the monitoring script to the host `crontab`:

```bash
# Edit crontab
crontab -e

# Add entry (runs every 2 minutes)
*/2 * * * * /home/deploy/VibeGrid_Services/scripts/monitor-health.sh >> /tmp/vibegrid-cron.log 2>&1
```

Configure credentials in `$HOME/.vibegrid_alert.env`:

```bash
ALERT_WEBHOOK_URL="https://discord.com/api/webhooks/..."
TELEGRAM_BOT_TOKEN="123456789:ABC..."
TELEGRAM_CHAT_ID="-1001234567890"
```

---

## 6. Security Principles

1. **No Credentials in Repository**: Secrets must be injected via runtime `.env` or Docker secrets.
2. **Database Isolation**: PostgreSQL, MongoDB, Redis, and RabbitMQ container ports are bound locally (`127.0.0.1`) or kept on internal Docker networks (`vibegrid-net`).
3. **Cookie Hardening**: `accessToken` and `refreshToken` remain `HttpOnly`, `SameSite=Lax/Strict`, and `Secure` in production environments.
