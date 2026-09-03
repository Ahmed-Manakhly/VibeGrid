# Flow 01 — Auth & Profile Seeding

## Overview
Exercises real HTTP/API boundaries to register users, verify emails, authenticate, and populate PostgreSQL user profiles.

## Scope
- Registers 3 test users (`aelmnakhly@gmail.com`, `manakhly.tech@gmail.com`, `seed_tester@vibegrid.com`).
- Preserves Admin user.
- Saves authentication tokens to `session_state.json`.

## Usage
```bash
node seeding_scripts/01_auth_profile_flow/bot.js
node seeding_scripts/01_auth_profile_flow/reset.js
```
