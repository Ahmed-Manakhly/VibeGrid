# Architecture Impact Report — Async Worker Pool & Consumer Idempotency

> **Document Location:** `docs/architecture/async-worker-pool-impact.md`  
> **Date:** September 5, 2026  
> **Status:** APPROVED & ACTIVE  

---

## 1. Executive Summary

This document details the architecture design and impact of completing the **Async Worker Pool** and **Consumer Idempotency Layer** for VibeGrid.

The system relies on an **at-least-once delivery model**:
```text
Database Transaction ──► OutboxEvent ──► Outbox Relay ──► RabbitMQ (domain.events)
```
Because transient network failures or process restarts during message ACK can cause duplicate delivery of events from RabbitMQ, downstream workers must enforce **strict consumer idempotency** to prevent duplicate side effects (such as duplicate timeline feed entries, duplicate user notifications, or duplicate search index projections).

---

## 2. Worker Topology & Queue Mapping

```text
                                RabbitMQ Exchange
                                 (domain.events)
                                        │
     ┌──────────────────┬───────────────┼───────────────┬──────────────────┐
     │                  │               │               │                  │
     ▼                  ▼               ▼               ▼                  ▼
  q.email       q.user.onboarding q.timeline.fanout q.notifications.push q.search.indexing
     │                  │               │               │                  │
     ▼                  ▼               ▼               ▼                  ▼
Email Worker     Onboarding Worker FanOutWorker   NotificationWorker SearchIndexWorker
(Existing)       (Existing)        (New)          (New)              (New)
     │                  │               │               │                  │
     ▼                  ▼               ▼               ▼                  ▼
Nodemailer         PostgreSQL      Redis Timeline  PostgreSQL          PostgreSQL
(SMTP)             (Profile)       (LPUSH/Trim)    (Notification DB)   (TSVector Projection)
```

### Queue & Binding Matrix

| Worker | Primary Queue | Bound Routing Keys | Target Effect |
| :--- | :--- | :--- | :--- |
| **Email Worker** | `q.email` | `user.registered`, `email.verification.*` | Transactional Email Dispatch |
| **Onboarding Worker** | `q.user.onboarding` | `user.registered` | Profile Initialization |
| **FanOutWorker** | `q.timeline.fanout` | `vibe.created`, `regrid.created` | Redis Timeline LPUSH (Hybrid Fan-Out) |
| **NotificationWorker** | `q.notifications.push` | `user.followed`, `like.toggled`, `comment.added` | DB Notification Insert |
| **SearchIndexWorker** | `q.search.indexing` | `vibe.created`, `user.registered`, `profile.updated` | TSVector / Text Index Upsert |
| **DLQ** | `q.dlq` | Direct binding via DLX | Bounded Retry Exceeded Sinks |

---

## 3. Consumer Idempotency Strategy (Three-State Claim Lifecycle)

To prevent duplicate processing across all asynchronous workers, an atomic two-phase claim mechanism is enforced via `RedisCacheService`:

```text
Incoming Message (eventId)
         │
         ▼
Check Redis key: `idempotency:<queue>:<eventId>`
         │
 ┌───────┴───────────────────────────────┐
 │ State: UNSEEN                         │ State: IN_PROGRESS / COMPLETED
 ▼                                       ▼
Acquire Lease lock (TTL: 30s)           Skip message & ACK to RabbitMQ
 │
 ▼
Execute Domain Use Case
 │
 ├── Success ──► Set State: COMPLETED (TTL: 7 days) ──► ACK Message
 └── Failure ──► Release Lease Lock ──────────────────► Retry / NACK
```

---

## 4. Bounded Retry Policy & Dead Letter Queue (DLQ)

1. **Transient Failures:** Maximum 3 retries with exponential backoff (1s, 2s, 4s).
2. **Max Attempts Exceeded:** Message routed to Dead Letter Exchange (`dlx.domain`) and delivered to `q.dlq`.
3. **Preserved Metadata:** DLQ messages store original `eventId`, `eventType`, `correlationId`, `attempt`, `originalQueue`, and `failureReason`.

---

## 5. Hybrid Fan-Out Strategy

- **Standard Accounts (< 5,000 Followers):** Push model — `FanOutWorker` fetches follower IDs and prepends the new post ID to `timeline:{followerId}` in Redis (max 800 items).
- **Celebrity / High-Follower Accounts (≥ 5,000 Followers):** Pull model — `FanOutWorker` skips push fan-out for that author; followers pull from the author's outbox during feed query execution.

---

## 6. Backward Compatibility & Non-Disruption Guarantee

- **Existing `services/email` and `services/onboarding` remain 100% untouched.**
- **Existing Auth, Media, Nginx, and Outbox services remain 100% active.**
- **Correlation ID (`X-Request-ID`) is propagated end-to-end into worker Pino logs.**
