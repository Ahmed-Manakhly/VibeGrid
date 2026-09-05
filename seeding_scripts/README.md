# VibeGrid — Standalone HTTP Seeding Infrastructure

## Overview

VibeGrid utilizes a **standalone HTTP seeding architecture**. Seeder bots interact with the system strictly as external HTTP automation clients over public HTTP APIs (`/api/auth/login`, `/api/posts`, `/api/media/...`, `/api/social/...`, `/api/notifications`).

**Key Architectural Rules:**
1. **No direct ORM/Database access** in seeding bots (Flow 00 taxonomy is independent DB initialization).
2. **No Prisma seed hooks** or `prisma/seed.ts`.
3. **Public Application Boundaries Only**: Seeder bots authenticate and send HTTP requests exactly like real client applications.
4. **Data & Session Contract**: State is preserved across flows in `session_state.json` and driven by `data_input.json`. Sensitive credentials and raw secrets are never persisted to session state.

> [!WARNING]
> **Full System Wipe (Two Databases)**
> VibeGrid uses PostgreSQL (for profiles) and MongoDB (for auth credentials). To perform a true full wipe before seeding, you must clean both:
> 1. `node seeding_scripts/db_cleaners/clean_all.js --confirm` (Wipes Prisma/PostgreSQL, **INCLUDING** Admins)
> 2. `node ../VibeGrid_Services/services/auth/scripts/clean_mongo.js --include-admins` (Wipes MongoDB completely, **INCLUDING** Admins)

---

## Flow Hierarchy & Canonical Execution Order

```text
Flow 00 — Taxonomy (Independent, db-level initialization)
   ↓
Flow 01 — Auth & Profiles (User registration, email verification, session state)
   ↓
Flow 02 — Posts & Media (Post creation, media intent, presigned upload, confirmation)
   ↓
Flow 03 — Social Graph (Follow relationships)
   ↓
Flow 04 — Engagement (Likes, comments, Re-Grid audit)
   ↓
Flow 05 — Notifications Verification (Fetch notifications, verify events, mark as read)
```

---

## Commands

### Orchestrator

```bash
# Run canonical HTTP seeding stream (Flows 01–05)
node seeding_scripts/run_all.js

# Run all flows including Flow 00 Taxonomy
node seeding_scripts/run_all.js all

# Reset all seeded state (reverse order)
node seeding_scripts/run_all.js reset

# Run specific flows
node seeding_scripts/run_all.js 01 02
```

### Individual Flow Bots

```bash
node seeding_scripts/00_taxonomy_flow/bot.js
node seeding_scripts/01_auth_profile_flow/bot.js
node seeding_scripts/02_posts_media_flow/bot.js
node seeding_scripts/03_social_graph_flow/bot.js
node seeding_scripts/04_engagement_flow/bot.js
node seeding_scripts/05_notifications_flow/bot.js
```

---

## Data & Session Contract

- **`seeding_scripts/data_input.json`**: Authoritative input specifications for users, posts, media fixtures, social graph connections, and engagement specs.
- **`seeding_scripts/session_state.json`**: Runtime state holding authenticated user IDs, post IDs, relationship maps, and notification verification metrics generated during execution.

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `BFF_URL` | VibeGrid BFF HTTP Base URL | `http://localhost:3000/api` |
| `API_URL` | Internal API Gateway URL | `http://localhost:8000/api` |
| `THROTTLE_MS` | Delay between seeding HTTP requests | `300` |

---

## Error & Retry Policy

- **Shared HTTP Helper (`seeding_scripts/shared/http.js`)**: Wraps native HTTP fetch requests with timeout management and automatic retry for transient status codes (`408`, `429`, `500`, `502`, `503`, `504`).
- **Fatal Error Handling**: Non-transient errors (`400`, `401`, `403`, `404`, `409`, `422`) fail loudly and immediately return non-zero exit code (`process.exit(1)`).
