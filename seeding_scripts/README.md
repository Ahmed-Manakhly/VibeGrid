# VibeGrid — Standalone HTTP Seeding Infrastructure & Seeding Engine

## Overview

VibeGrid utilizes a **standalone HTTP seeding architecture** following the battle-tested **ModelLink** (2-file consumable queue + session state) and **Millensys** (single edge HTTPS ingress) paradigms. 

Seeder bots interact with the system strictly as external HTTP automation clients over public HTTP REST APIs (`/api/auth/login`, `/api/posts`, `/api/media/...`, `/api/social/...`, `/api/messages/...`, `/api/notifications`).

**Key Architectural Rules:**
1. **No direct ORM/Database access** in forward seeding bots: All forward seeding executes over public HTTP (`/api/*`), ensuring 100% environment parity between local development (`http://localhost:3000/api`) and the remote production VPS (`https://www.vibegrid.manakhly.tech/api`).
2. **Dual-Ingress Architecture By Design:**
   * **Real Web Users:** Use Next.js Server Actions (`src/actions/*.action.ts`) for browser forms and optimistic mutations.
   * **REST API Routes:** Maintained by design for **Seeding Bots**, **Postman Collections** (`TESTING-POSTMAN.txt`), and **Future Mobile Apps** (iOS/Android) that cannot invoke Next.js Server Actions.
   * Both pathways delegate to the exact same Clean Architecture Use Cases (`@/modules/*/application/`), ensuring zero duplicate logic.
3. **The 2-File Consumable Queue Pattern (ModelLink):**
   * `data_reference.json`: The immutable ground truth and master reference specification.
   * `data_input.json`: The active working queue consumed during execution.
4. **Session State Persistence (`session_state.json`):** Preserves tokens, user IDs, post IDs, poll IDs, and community IDs across flows so downstream bots reuse state without re-authenticating or guessing IDs.

> [!WARNING]
> **Full System Wipe vs Flow Reset**
> * **Per-Flow Reset (`node seeding_scripts/run_all.js reset`):** Only cleans up session cache references in reverse order.
> * **Full Database Wipe (Local):**
>   1. `node services/auth/scripts/clean_mongo.js --include-admins` (Wipes MongoDB auth credentials)
>   2. `node services/media/scripts/clean_media_mongo.js` (Wipes Media assets)
>   3. `node seeding_scripts/db_cleaners/clean_all.js --confirm` (Wipes PostgreSQL 27 tables & Redis)
> * **Full Database Wipe (Production VPS):**
>   ```bash
>   bash seeding_scripts/remote_clean_prod.sh --confirm
>   ```

---

## Flow Hierarchy & Canonical Execution Order

```text
Flow 00 — System Taxonomy (Categories, Vibes) [Direct Prisma]
   ↓
Flow 01 — Auth, Profiles & Topic Interests (User registration, seed OTP, bio, categories)
   ↓
Flow 06 — Developer Communities & Guilds (Foundational guilds, rules, initial memberships)
   ↓
Flow 02 — Rich Posts Engine (MinIO media, Tech Dilemma Polls, Code Snippets, Q&A)
   ↓
Flow 03 — Dense Social Graph (Follow relationships & reciprocal connections)
   ↓
Flow 04 — Engagement (Likes, Threaded Comments, Dilemma Poll Votes, Accepted Solutions, Re-Grids)
   ↓
Flow 05 — Social Signals (Bookmarks / Saved Posts) & Notifications Verification
   ↓
Flow 07 — Direct Messaging & Conversations (1-on-1 private threads & real-time chat)
```

---

## Commands & Orchestration

### Master Orchestrator

```bash
# Run canonical HTTP seeding stream (Flows 01–07)
node seeding_scripts/run_all.js

# Run all flows including Flow 00 Taxonomy
node seeding_scripts/run_all.js all

# Reset all seeded state (reverse order)
node seeding_scripts/run_all.js reset

# Run specific flows (e.g. Auth + Communities + Posts)
node seeding_scripts/run_all.js 01 06 02
```

### Individual Flow Bots

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

---

## Environment Configuration (`seeding_scripts/.env`)

| Variable | Description | Example (Local Dev) | Example (Remote VPS) |
| :--- | :--- | :--- | :--- |
| `API_URL` | Edge Ingress Target URL | `http://localhost:3000/api` | `https://www.vibegrid.manakhly.tech/api` |
| `BFF_URL` | BFF Ingress Target URL | `http://localhost:3000/api` | `https://www.vibegrid.manakhly.tech/api` |
| `SEED_OTP` | Dev Bypass OTP for seed users | `123456` | `123456` |
| `THROTTLE_MS` | Delay between HTTP requests | `300` | `300` |

---

## Data & Session Contract

- **`seeding_scripts/data_reference.json`**: Master immutable data specification.
- **`seeding_scripts/data_input.json`**: Active consumable working queue.
- **`seeding_scripts/session_state.json`**: Cross-flow runtime session state cache.
- **`seeding_scripts/fixtures/`**: Real tech imagery and assets uploaded directly to MinIO.
