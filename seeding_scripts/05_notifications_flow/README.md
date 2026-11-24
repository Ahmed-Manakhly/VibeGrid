# Flow 05 — Bookmarks & Notifications Verification

## Overview
Seeds user post bookmarks and verifies that preceding social actions (follows, likes, comments, poll votes, mentions) properly generated real-time notification events in the database, subsequently testing the notification read-state update API.

## Scope
- **14 Saved Bookmarks:** Distributed across developer personas.
- **Notification Verification:** Validates notification counts and payloads for all 8 personas.
- **Read State Update:** Updates unread notification badges via `PATCH /api/notifications`.

## Endpoints Exercised
- `POST /api/auth/login`
- `POST /api/posts/[id]/bookmark`
- `GET /api/notifications`
- `PATCH /api/notifications`

## Execution

```bash
# Forward Seeding (HTTP)
node seeding_scripts/05_notifications_flow/bot.js        # Local
node seeding_scripts/05_notifications_flow/bot.js prod   # Remote VPS

# Targeted Bot Reset (Deletes seeded bookmarks and bot notifications)
node seeding_scripts/05_notifications_flow/reset.js                     # Local (Prisma)
bash seeding_scripts/05_notifications_flow/remote_reset.sh --confirm   # Remote VPS (SSH/Docker stdin)
```
