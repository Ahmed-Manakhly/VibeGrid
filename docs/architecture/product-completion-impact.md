# Architecture Impact Report — Product, Feed, Social, Engagement & Re-Grid Completion

> **Document Location:** `docs/architecture/product-completion-impact.md`  
> **Date:** September 5, 2026  
> **Status:** APPROVED & ACTIVE  

---

## 1. Executive Summary

This document details the architecture design and impact of completing the core user-facing product vertical slice for VibeGrid:
1. **Feed Read Path & Caching:** Hybrid timeline read strategy leveraging Redis (`timeline:{userId}`) hydrated with Prisma batch queries, stampede protection via `RedisCacheService`, and pull fallback for hot accounts / explore queries.
2. **Post Lifecycle:** Complete Post Create, Read, and Delete flows integrated with Transactional Outbox domain events (`vibe.created`, `post.deleted`) and MinIO media presigned upload intent confirmation.
3. **Engagement & Social Graph:** Complete Follow/Unfollow, Like/Unlike, Comment, and Re-Grid amplification flows. All actions produce atomic Outbox events that trigger RabbitMQ workers (`NotificationWorker`, `FanOutWorker`, `SearchIndexWorker`) and push live Socket.IO events (`notification:new`, `feed:updated`).
4. **Re-Grid Domain Model:** Unblocks the Re-Grid gap by introducing the `ReGrid` relational entity (`userId`, `postId` unique tuple), `ReGridVibeUseCase`, `regrid.created` Outbox event, and updating HTTP Seeding Flow 04.
5. **Profile & Avatar Polish:** Profile updates with MinIO media avatar binding, cache invalidation, and UI presentation.
6. **Search & Notifications UX:** Search API leveraging derived search projections and Notifications read state management.

---

## 2. Component Boundaries & Event Flow Matrix

```text
User Mutation (HTTP API) ──► Application Use Case ──► Transactional Outbox (DB)
                                                            │
                                                            ▼ (SKIP LOCKED Relay)
                                                        RabbitMQ
                                                            │
                                       ┌────────────────────┴────────────────────┐
                                       ▼                                         ▼
                                FanOutWorker                            NotificationWorker
                                       │                                         │
                                       ▼                                         ▼
                             Redis Timelines & Pub/Sub                PostgreSQL Notifications & Pub/Sub
                                       │                                         │
                                       └────────────────────┬────────────────────┘
                                                            ▼
                                                   Realtime Gateway (:8005)
                                                            │
                                                            ▼ (Socket.IO)
                                                    Client Browsers
```

| User Action | DB Entity Mutation | Outbox Event Type | Consumer Action | Realtime Signal |
| :--- | :--- | :--- | :--- | :--- |
| **Create Post** | `Post.create` | `vibe.created` / `post.created` | `FanOutWorker` (Redis LPUSH), `SearchIndexWorker` | `feed:updated` |
| **Delete Post** | `Post.delete` | `post.deleted` | `SearchIndexWorker` (delete document), Redis invalidation | `feed:updated` |
| **Follow User** | `Follows.create` | `user.followed` / `social.followed` | `NotificationWorker` (create Follow notification) | `notification:new` |
| **Like Post** | `Like.create` | `like.toggled` / `engagement.liked` | `NotificationWorker` (create Like notification) | `notification:new` |
| **Add Comment** | `Comment.create` | `comment.added` / `engagement.commented` | `NotificationWorker` (create Comment notification) | `notification:new` |
| **Re-Grid Post** | `ReGrid.create` | `regrid.created` | `FanOutWorker` (timeline amplification), `NotificationWorker` | `feed:updated` / `notification:new` |

---

## 3. Cache Invalidation Matrix

- **Post Delete:** Invalidate `post:{id}` cache key, delete timeline occurrences, publish `post.deleted` Outbox event.
- **Follow / Unfollow:** Invalidate social graph cache (`followers:{id}`, `following:{id}`).
- **Profile / Avatar Update:** Invalidate `user:profile:{username}` and `user:profile:id:{id}` cache keys.
- **Feed Queries:** Cached using TTL (300s) + jitter with stampede protection via `getOrSet`.

---

## 4. Re-Grid Unblock Strategy

1. **Database Schema:** `ReGrid` model with `@@unique([userId, postId])` unique constraint.
2. **Domain Action:** `POST /api/posts/[id]/regrid` toggles amplification state and writes `regrid.created` to Transactional Outbox.
3. **Seeding Unblock:** `seeding_scripts/04_engagement_flow/bot.js` executes live `POST /posts/${id}/regrid` HTTP calls during `node seeding_scripts/run_all.js`.
