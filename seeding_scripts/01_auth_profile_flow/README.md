# Flow 01 — Auth, Profiles & Topic Interests Seeding

## Overview
Automates persona registration, email verification with seed OTP bypass, MinIO avatar fixture uploads, profile details updating, and topic interests assignment via HTTP API ingress.

## Scope
- **8 Realistic Developer Personas:** Defined in `data_reference.json` / `data_input.json`.
- **Media Ingress:** Uploads real WebP avatar fixtures to MinIO via `/api/media/upload-intent`.
- **Topics:** Maps developer tech interests to categories via `PUT /api/social/interests`.
- **Session State:** Saves user IDs, access tokens, and usernames to `session_state.json` for downstream flows (02–07).

## Execution

```bash
# Forward Seeding (HTTP)
node seeding_scripts/01_auth_profile_flow/bot.js        # Local
node seeding_scripts/01_auth_profile_flow/bot.js prod   # Remote VPS

# Targeted Bot Reset (Deletes only Flow 01 bot users, refills queue)
node seeding_scripts/01_auth_profile_flow/reset.js                     # Local (Prisma)
bash seeding_scripts/01_auth_profile_flow/remote_reset.sh --confirm   # Remote VPS (SSH/Docker)
```
