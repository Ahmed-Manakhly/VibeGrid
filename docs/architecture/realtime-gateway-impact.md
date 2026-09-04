# Architecture Impact Report — Realtime Gateway + Redis Pub/Sub

> **Document Location:** `docs/architecture/realtime-gateway-impact.md`  
> **Date:** September 5, 2026  
> **Status:** APPROVED & ACTIVE  

---

## 1. Executive Summary

This document details the architecture design and impact of implementing **Phase 2.4 — Realtime Gateway + Redis Pub/Sub**.

The Realtime Gateway enables real-time notification pushes, feed update signals, and multi-device online presence tracking using Socket.IO horizontal scaling over Redis Pub/Sub (`realtime:notification`, `realtime:feed`, `realtime:presence`).

```text
Domain Event ──► Outbox ──► Relay ──► RabbitMQ ──► NotificationWorker / FanOutWorker
                                                            │
                                                            ▼ (Redis Pub/Sub)
                                                   Realtime Gateway (:8005)
                                                            │
                                                            ▼ (Socket.IO RS256 JWT)
                                                    Connected Browsers
```

---

## 2. Service Port & Topology Reconciliation

| Service | Internal Port | Host Port | Ingress Route | Health Endpoint |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js BFF** | `3000` | `3000` | `/` | `GET /api/health` |
| **Nginx Gateway** | `8000` | `8000` | Ingress Entry | `GET /health` |
| **Auth Microservice** | `8001` | `8001` | `/api/auth/*` | `GET /health` |
| **Media Microservice** | `3002` | `8002` | `/api/media/*` | `GET /health` |
| **Email Service** | `8003` | N/A | Worker internal | `GET /health` |
| **Onboarding Worker** | `8004` | N/A | Worker internal | `GET /health` |
| **Realtime Gateway** | **`8005`** | **`8005`** | `/socket.io/*` | `GET /health` |

> **Port Conflict Resolution:** Previous diagrams tentatively referenced port `3002` for both Media and Realtime. Media Service is active and verified on port `3002`. Realtime Gateway is allocated port **`8005`** internally and exposed on host port `8005` and via Nginx `/socket.io/*`.

---

## 3. Security & Authentication Boundary

1. **RS256 JWT Verification:**
   - Socket connections must authenticate during the initial handshake (`socket.handshake.auth.token`, `socket.handshake.query.token`, or `cookie`).
   - The Realtime Gateway verifies tokens using the RS256 public key (`JWT_PUBLIC_KEY` or `JWT_PUBLIC_KEY_PATH`). Private keys remain strictly isolated within Auth Service.
2. **Identity Attachment & Server-Controlled Rooms:**
   - Decoded token payload attaches `{ userId, email, role }` to `socket.data.user`.
   - Client is automatically joined to room `user:{userId}`.
   - **Authorization Guard:** Clients cannot arbitrarily join other users' rooms.
3. **Short-Lived Access Token Handling:**
   - Active sockets remain connected for the connection duration.
   - On disconnect / reconnect, the client re-authenticates using a valid RS256 access token.

---

## 4. Redis Pub/Sub & Presence Architecture

1. **Dedicated Redis Client Connections:**
   - **Publisher Client:** Used by workers/services to publish events.
   - **Subscriber Client:** Dedicated ioredis instance for Redis Pub/Sub subscriptions.
   - **Data Client:** Standard ioredis instance for presence key operations.
2. **Presence Keys & Multi-Device Tracking:**
   - Key Schema: `presence:user:{userId}` (Hash mapping `socketId` → `connectedAt timestamp` with TTL).
   - connection count > 0 → Status `online` emitted to `realtime:presence` Pub/Sub channel.
   - connection count = 0 → Status `offline` emitted to `realtime:presence` Pub/Sub channel.
3. **Canonical Event Map (Server ──► Client):**
   - `presence:online` — Payload: `{ userId: string, timestamp: number }`
   - `presence:offline` — Payload: `{ userId: string, timestamp: number }`
   - `notification:new` — Payload: Notification DTO `{ id, type, actorId, targetId, payload, createdAt }`
   - `feed:updated` — Payload: Feed Signal `{ type: "new_content" | "post_deleted", postId?: string }`

---

## 5. Compatibility & Regression Guard

This implementation:
- Protects existing `NotificationWorker` (worker handles DB persistence, then publishes to Redis Pub/Sub).
- Protects existing `FanOutWorker` (worker updates Redis timeline sorted sets, then publishes feed update signal).
- Reuses `PinoLogger` and `X-Request-ID` correlation ID context binding.
- Preserves all verified Auth, Media, Email, Onboarding, Outbox, and Seeding flows.
