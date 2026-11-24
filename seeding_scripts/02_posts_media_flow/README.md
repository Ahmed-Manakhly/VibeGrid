# Flow 02 — Rich Posts, Media, Polls, Code & Q&A Seeding

## Overview
Exercises the multi-format rich post creation engine via authenticated user sessions over public edge REST API. Supports media uploads via MinIO presigned intents, interactive polls, code architecture snippets, and question posts.

## Scope
- **34 Realistic Developer Posts:**
  - 23 Standard Posts with multi-format media fixtures (JPEG, PNG, WebP)
  - 4 Tech Dilemma Polls with voting options & expiration
  - 3 Question & Answer Posts with syntax highlighting
  - 4 Code Architecture Snippets
- **Taxonomy Attribution:** Resolves and binds dynamic Category and Vibe IDs via `/api/feed/filters`.
- **Media Pipeline:** 3-step MinIO upload (`upload-intent` -> S3 PUT -> `confirm-upload`).

## Endpoints Exercised
- `POST /api/auth/login`
- `GET /api/feed/filters`
- `POST /api/media/upload-intent`
- `POST /api/media/confirm-upload`
- `POST /api/posts`
- `GET /api/posts` (Verification)

## Execution

```bash
# Forward Seeding (HTTP)
node seeding_scripts/02_posts_media_flow/bot.js        # Local
node seeding_scripts/02_posts_media_flow/bot.js prod   # Remote VPS

# Targeted Bot Reset (Deletes bot posts, comments, likes, polls & clears post session IDs)
node seeding_scripts/02_posts_media_flow/reset.js                     # Local (Prisma)
bash seeding_scripts/02_posts_media_flow/remote_reset.sh --confirm   # Remote VPS (SSH/Docker stdin)
```
