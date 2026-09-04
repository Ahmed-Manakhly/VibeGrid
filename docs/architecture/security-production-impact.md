# Architecture Impact Report — Security Hardening, Health Monitoring & Production Infrastructure

> **Document Location:** `docs/architecture/security-production-impact.md`  
> **Date:** September 5, 2026  
> **Status:** APPROVED & ACTIVE  

---

## 1. Executive Summary

This document details the architecture design, security enforcement, and health monitoring infrastructure implemented in **Phase 2.8 / Phase 1.1.2 — Security Hardening, Health Monitoring & Production Infrastructure**:

1. **Silent Access Token Refresh:** Seamless background access token renewal in Next.js BFF middleware when RS256 access tokens expire, exchanging HttpOnly `vibegrid_refresh_token` without user interruption or infinite redirect loops.
2. **CSRF & Origin Guard:** Defense-in-depth origin and header validation (`SameSite=Lax` HttpOnly cookies, `Origin` / `Referer` verification, `X-Requested-With` header enforcement) on state-changing HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`).
3. **Distributed Rate Limiting:** Standardized rate limiting utilizing `RedisCacheService.rateLimit` on Auth, API Gateway, and application routes returning HTTP 429 with `Retry-After` headers and Pino log correlation threading.
4. **Millensys Health Monitoring Infrastructure:** `scripts/monitor-health.sh` health check runner verifying runtime ports (BFF `:3000`, Gateway `:8000`, Auth `:8001`, Media `:3002`, Email `:8003`, Onboarding `:8004`, Realtime `:8005`) with CLI alert test flags (`--test-warning`, `--test-critical`, `--test-recovery`) and `.vibegrid_alert.env` configuration.
5. **Production Docker Compose & VPS Topology:** Authoritative production topology documented in `docs/deployment/vps-topology.md` detailing multi-container orchestration, MinIO media (`vibegrid-media`) vs log storage (`vibegrid-logs`), durable RabbitMQ exchanges/queues, and host Nginx SSL ingress.

---

## 2. Silent Access Token Refresh Architecture

```text
Incoming Request ──► Next.js Middleware
                         │
         ┌───────────────┴───────────────┐
         │ Access Token Valid            │ Access Token Expired / Missing
         ▼                               ▼
    Proceed to Route            Check HttpOnly Refresh Token
                                         │
                         ┌───────────────┴───────────────┐
                         │ Present                       │ Missing / Invalid
                         ▼                               ▼
                 Auth Service /refresh           Clear Auth Cookies &
                         │                       Redirect to /login
          ┌──────────────┴──────────────┐
          │ Refresh Success             │ Refresh Failed
          ▼                             ▼
   Set New Cookies &             Clear Auth Cookies &
   Proceed Request               Redirect to /login
```

---

## 3. Security Audit & Protection Matrix

| Vulnerability Vector | Defense Mechanism | Implementation Point |
| :--- | :--- | :--- |
| **Token Theft / XSS** | HttpOnly, `SameSite=Lax`, `Secure` cookies. Zero localStorage token storage. | Next.js Middleware & Auth Service |
| **CSRF Attacks** | Origin/Referer header check + `SameSite=Lax` cookies for `POST`/`PUT`/`DELETE`. | Next.js Middleware |
| **Brute Force / Abuse** | Redis-backed sliding window rate limiter (HTTP 429 + `Retry-After`). | `RedisCacheService` & API Routes |
| **Token Family Replay** | Auth Service token family revocation & `passwordChangedAt` invalidation. | Auth Microservice |
| **Log Credential Leakage** | Pino log redaction (`authorization`, `token`, `password`, `secret`). | `PinoLogger` & Microservices |

---

## 4. Reconciled Production Port Map

| Service | Internal Container | Host Port | Route Ingress | Health Endpoint |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js BFF** | `:3000` | `3000` | `/` | `GET /api/health` |
| **Nginx Gateway** | `:8000` | `8000` | Gateway Ingress | `GET /health` |
| **Auth Service** | `:8001` | `8001` | `/api/auth/*` | `GET /health` |
| **Media Service** | `:3002` | `8002` | `/api/media/*` | `GET /health` |
| **Email Service** | `:8003` | N/A | Worker internal | `GET /health` |
| **Onboarding Worker** | `:8004` | N/A | Worker internal | `GET /health` |
| **Realtime Gateway** | `:8005` | `8005` | `/socket.io/*` | `GET /health` |
