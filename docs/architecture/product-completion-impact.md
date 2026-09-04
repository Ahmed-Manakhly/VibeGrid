# Architecture Impact Report — Product, Feed, Social, Engagement & Re-Grid Completion

> **Document Location:** `docs/architecture/product-completion-impact.md`  
> **Date:** September 5, 2026  
> **Status:** APPROVED & ACTIVE  

---

## 1. Executive Summary

This document details the architectural design and impact of completing the core user-facing product vertical slice for VibeGrid with strict adherence to a **Server-First Feed Architecture**.

1. **Server-First Feed Ownership:** `src/app/page.tsx` (React Server Component) remains the authoritative owner of the initial feed query (`GenerateFeedUseCase`). It executes server-side timeline fetching, hydrates cached Redis timelines, and passes `initialPosts` and `initialNextCursor` to the Client Component layer.
2. **Thin Interaction Client Layer:** `InfiniteScroll` is strictly responsible for browser interaction (intersection observer, load-more cursor continuation, transient page holding, and controlled realtime prepending). It does NOT query Prisma/Redis or enforce feed business logic.
3. **Current-User Mutation Path:** Post creation follows `CreatePostForm` → Server Action (`creatPost`) → DB Transaction + Transactional Outbox → `revalidatePath('/')`. Next.js revalidates the server feed without relying on client-side `router.refresh()` workarounds.
4. **Controlled Realtime Merge Path:** Socket.IO `feed:updated` signals trigger a controlled, server-backed fetch (`/api/posts?limit=5`) to retrieve new posts. The client prepends non-duplicate posts to state while preserving existing loaded pagination pages.
5. **Re-Grid & Social Completion:** Fully verified Re-Grid domain entity (`ReGrid`), Follow/Unfollow, Like/Unlike, Comments, MinIO media uploads, Search indexing, and Notification delivery.

---

## 2. Detailed Architecture Separation

### Feed Ownership
- **Authoritative Source:** The server owns canonical feed data and pagination logic. Database queries and Redis timeline hydration are executed strictly within application Use Cases (`GenerateFeedUseCase`).

### Server Responsibility (`src/app/page.tsx`)
- Authenticates session and retrieves user ID.
- Executes `getPosts({ category, limit: 12 })` server-side.
- Serves initial HTML with pre-rendered feed content and `initialNextCursor`.
- Re-renders upon Server Action revalidation (`revalidatePath('/')`), producing updated `initialPosts`.

### Client Responsibility (`InfiniteScroll.tsx`)
- Detects scroll position using `IntersectionObserver`.
- Fetches additional pages via server API (`/api/posts?cursor=...`).
- Holds transient client state for loaded historical pages.
- Listens to `feed:updated` Socket.IO events and performs controlled top-page fetches to prepend new items without destroying existing loaded scroll state.

### Mutation Path (`revalidatePath('/')`)
```text
CreatePostForm (Client Component)
       │
       ▼ (FormData)
createPostFormAction / creatPost (Server Action)
       │
       ▼
createVibeUseCase.execute(...) (DB Transaction + Outbox)
       │
       ▼
revalidatePath('/') (Purges Next.js Router Cache)
       │
       ▼
Feed Server Component re-renders with fresh initialPosts
```

### Realtime Integration Path (`feed:updated`)
```text
User B creates post ──► Outbox ──► FanOutWorker ──► Realtime Gateway ──► feed:updated (Socket.IO)
                                                                               │
                                                                               ▼
                                                                  InfiniteScroll (User A)
                                                                               │
                                                                               ▼
                                                                 fetch('/api/posts?limit=5')
                                                                               │
                                                                               ▼
                                                               Prepend new posts to state
                                                               (Loaded pages preserved)
```

### Pagination Strategy
- Uses stable cursor-based pagination (`created_at` timestamp / post ID tuple).
- Supports deterministic ordering, duplicate prevention (`Set<string>` ID tracking), and seamless continuation after realtime insertions.

### Cache Strategy & Invalidation Matrix
- **Next.js Cache:** Revalidated via `revalidatePath('/')` on post creation, deletion, and engagement.
- **Redis Feed Cache:** `timeline:{userId}` managed with TTL (300s) + stampede protection (`getOrSet`). Updated asynchronously by `FanOutWorker`.

---

## 3. Component Boundaries & Event Flow Matrix

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
| **Delete Post** | `Post.delete` | `post.deleted` | `SearchIndexWorker` (delete doc), Redis invalidation | `feed:updated` |
| **Follow User** | `Follows.create` | `user.followed` | `NotificationWorker` (create notification) | `notification:new` |
| **Like Post** | `Like.create` | `engagement.liked` | `NotificationWorker` (create notification) | `notification:new` |
| **Add Comment** | `Comment.create` | `engagement.commented` | `NotificationWorker` (create notification) | `notification:new` |
| **Re-Grid Post** | `ReGrid.create` | `regrid.created` | `FanOutWorker` (timeline amplification), `NotificationWorker` | `feed:updated` / `notification:new` |

---

## 4. Re-Grid & Feature Verification

1. **Database Schema:** `ReGrid` model with `@@unique([userId, postId])` unique constraint.
2. **Domain Action:** `POST /api/posts/[id]/regrid` toggles amplification state and writes `regrid.created` to Transactional Outbox.
3. **Seeding & End-to-End:** All HTTP seeding scripts (`00` through `05`) run with 100% PASS rate.
