# VibeGrid — Standalone HTTP Seeding Infrastructure & Seeding Engine

## Overview

VibeGrid utilizes a **100% Standalone HTTP Seeding Architecture** following the battle-tested **ModelLink** (2-file consumable queue + cross-flow session state) and **Millensys** (single edge HTTPS ingress) paradigms.

Seeder bots interact with the platform strictly as external HTTP automation clients over public edge REST APIs (`/api/auth/login`, `/api/taxonomy/*`, `/api/posts`, `/api/communities`, `/api/media/...`, `/api/social/...`, `/api/messages/...`, `/api/notifications`).

### Key Architectural Rules

1. **Zero Direct ORM/Database Coupling in Forward Seeding:**
   * All forward seeding executes over public HTTP (`/api/*`), ensuring 100% environment parity between local development (`http://localhost:3000/api`) and the remote production VPS (`https://www.vibegrid.manakhly.tech/api`).
   * Platform Admin actions (Taxonomy, Guild Creation) authenticate as the bootstrap Admin over HTTP.
   * Developer interactions (Posts, Likes, Comments, Polls, Chats) authenticate as seed users over HTTP.

2. **Dual-Ingress Architecture By Design (Parity with Next.js Server Actions):**
   * **Real Web Users:** Use Next.js Server Actions (`src/actions/*.action.ts`) for browser forms and optimistic mutations.
   * **REST API Routes (`src/app/api/...`):** Maintained by design for **Seeding Automation Bots**, **Postman QA Collections** (`TESTING-POSTMAN.txt`), and **Future Mobile Apps** (iOS/Android) that cannot invoke Next.js Server Actions.
   * Both pathways delegate directly to the exact same Clean Architecture Use Cases (`@/modules/*/application/`), guaranteeing zero duplicate business logic.

3. **Consumable 2-File Queue Pattern (ModelLink):**
   * `data_reference.json`: The immutable master specification and ground truth.
   * `data_input.json`: The active working queue consumed during execution (automatically restored from reference if missing).

4. **Robust HTTP Client & Retry Policy (`shared/http.js`):**
   * Default timeout of 30,000ms with 5 max retry slots for transient network spikes (`500`, `502`, `503`, `504`, `AbortError`).
   * Guaranteed initial execution floor (`maxAttempts = 1 + Math.max(0, maxRetries)`) ensuring `maxRetries: 0` fires exactly 1 attempt.

5. **Cross-Flow Session State Persistence (`session_state.json`):**
   * Preserves JWT tokens, session cookies, user IDs, post IDs, poll IDs, and community IDs across flows so downstream bots reuse state without re-authenticating or guessing IDs.

6. **Strict Separation of Bot Resets vs. Raw Nuclear DB Wipers:**
   * **Targeted Bot Resets:** Run via `node seeding_scripts/reset_all.js` (local) or `bash seeding_scripts/remote_reset_all.sh --confirm` (remote VPS over SSH stdin). Deletes **only bot fixtures**, preserves manual UI users, and refills `data_input.json`. Large payloads are uploaded via `scp` to avoid `ARG_MAX` shell limits, while scripts run in container `WORKDIR /app` preserving module resolution.
   * **Raw Nuclear Database Wipers:** Run via `node seeding_scripts/raw_db_wipers/wipe_postgres_redis.js --confirm` (local) or `bash seeding_scripts/raw_db_wipers/remote_wipe_raw_db.sh --confirm` (remote VPS over SSH). Destroys **100% of all data down to bare metal**. Fully isolated inside `raw_db_wipers/`.

---

## Flow Hierarchy & Canonical Execution Order

```text
Flow 00 — System Taxonomy (Categories, Vibes) [Pure HTTP: Admin Login -> POST /api/taxonomy/*]
   ↓
Flow 01 — Auth, Profiles & Topic Interests (User registration, dev bypass OTP, PUT /api/profile)
   ↓
Flow 06 — Developer Communities & Guilds (Admin POST /api/communities, User POST /communities/[slug]/join)
   ↓
Flow 02 — Rich Posts Engine (MinIO media fixtures, Tech Dilemma Polls, Code Snippets, Q&A)
   ↓
Flow 03 — Dense Social Graph (POST /api/social/follow relationships & reciprocal connections)
   ↓
Flow 04 — Engagement (Likes, Threaded Comments, Dilemma Poll Votes, Accepted Solutions, Re-Grids)
   ↓
Flow 05 — Social Signals (Bookmarks / Saved Posts) & Realtime Notifications Verification
   ↓
Flow 07 — Direct Messaging & Conversations (1-on-1 private threads & real-time chat)
```

---

## Environment Configuration (`seeding_scripts/.env`)

Configure target endpoints, admin credentials, and SSH connectivity in `seeding_scripts/.env`:

```bash
# Active Seeding Target (local | prod)
SEED_ENV=local

# Edge REST Ingress Endpoints
LOCAL_API_URL=http://localhost:3000/api
PROD_API_URL=https://www.vibegrid.manakhly.tech/api

# Remote VPS SSH Host for Production DB Cleaners & Remote Resets
VPS_SSH_HOST=root@your-vps-ip

# Fixed Development / Seeding Bypass OTP (matches FIXED_SEED_OTP in Backend)
SEED_OTP=123456

# Bootstrap Platform Admin Credentials (MUST match ADMIN_EMAIL & ADMIN_PASSWORD in services/auth/.env)
ADMIN_EMAIL=admin@vibegrid.manakhly.tech
ADMIN_PASSWORD=V1b3Gr1d_Adm!n2026
```

---

## Commands & Orchestration

### 1. Forward Seeding (Pure HTTP — Works Locally & Remotely)

```bash
# Run canonical HTTP seeding stream (Flows 01–07)
node seeding_scripts/run_all.js

# Run all flows including Flow 00 Taxonomy (Flows 00–07)
node seeding_scripts/run_all.js all

# Run specific targeted flows (e.g. Taxonomy + Auth + Communities)
node seeding_scripts/run_all.js 00 01 06

# Target Remote Production VPS via CLI flag:
node seeding_scripts/run_all.js prod all
```

### 2. Individual Flow Bots (Pure HTTP)

```bash
node seeding_scripts/00_taxonomy_flow/bot.js
node seeding_scripts/01_auth_profile_flow/bot.js
node seeding_scripts/06_communities_flow/bot.js
node seeding_scripts/02_posts_media_flow/bot.js
node seeding_scripts/03_social_graph_flow/bot.js
node seeding_scripts/04_engagement_flow/bot.js
node seeding_scripts/05_notifications_flow/bot.js
node seeding_scripts/07_messages_flow/bot.js
```

### 3. Targeted Bot-Only Reset Scripts (Prisma — Preserves Manual UI Data & Refills Queue)

```bash
# Local execution: Reset all bot flows in reverse order & refill data_input.json:
node seeding_scripts/reset_all.js
# (or: node seeding_scripts/run_all.js reset)

# Local execution: Reset individual bot flows:
node seeding_scripts/00_taxonomy_flow/reset.js
node seeding_scripts/01_auth_profile_flow/reset.js
node seeding_scripts/06_communities_flow/reset.js
node seeding_scripts/02_posts_media_flow/reset.js
node seeding_scripts/03_social_graph_flow/reset.js
node seeding_scripts/04_engagement_flow/reset.js
node seeding_scripts/05_notifications_flow/reset.js
node seeding_scripts/07_messages_flow/reset.js

# Remote execution on VPS over SSH: Reset all bot flows in reverse order & refill local queue:
bash seeding_scripts/remote_reset_all.sh --confirm

# Remote execution on VPS over SSH: Reset individual bot flows:
bash seeding_scripts/00_taxonomy_flow/remote_reset.sh --confirm
bash seeding_scripts/01_auth_profile_flow/remote_reset.sh --confirm
bash seeding_scripts/06_communities_flow/remote_reset.sh --confirm
bash seeding_scripts/02_posts_media_flow/remote_reset.sh --confirm
bash seeding_scripts/03_social_graph_flow/remote_reset.sh --confirm
bash seeding_scripts/04_engagement_flow/remote_reset.sh --confirm
bash seeding_scripts/05_notifications_flow/remote_reset.sh --confirm
bash seeding_scripts/07_messages_flow/remote_reset.sh --confirm
```

---

### 4. Raw Infrastructure Database Wipers (Disaster Recovery — 100% Nuclear Wipe)

> **⚠️ WARNING:** These scripts destroy **100% of all data** across all datastores (real human manual accounts, bot personas, posts, chats, media metadata). They have zero connection to `data_input.json`.

```bash
# Local raw nuclear wipe (PostgreSQL & Redis):
node seeding_scripts/raw_db_wipers/wipe_postgres_redis.js --confirm

# Remote full-stack production wipe over SSH (MongoDB Auth + Media + PostgreSQL + Redis):
bash seeding_scripts/raw_db_wipers/remote_wipe_raw_db.sh --confirm
```

---

## Data & Session Contract

- **`seeding_scripts/data_reference.json`**: Master immutable data specification (8 personas, 34 rich posts, 4 polls, 3 Q&A, 4 code snippets). **Read-only.**
- **`seeding_scripts/data_input.json`**: Active consumable working queue. **Items pop upon successful seeding.**
- **`seeding_scripts/session_state.json`**: Cross-flow runtime session state cache.
- **`seeding_scripts/fixtures/`**: Real tech imagery uploaded directly to MinIO storage.
