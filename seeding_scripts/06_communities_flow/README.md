# Flow 06 — Developer Communities & Guilds Seeding

## Overview
Automates developer community (guild) creation by the platform admin and enrolls all 8 developer personas into their respective guilds.

## Scope
- **5 Developer Guilds:**
  - `frontend-architects` — Frontend Architects & UI Engineers
  - `ai-engineers` — AI Engineers & Autonomous Agents
  - `rust-systems` — Rust & Low-Level Systems
  - `devops-cloud-native` — DevOps & Cloud Native Tribe
  - `open-source-builders` — Open Source Builders & Maintainers
- **Full Enrollment:** Enrolls all 8 developer personas into all 5 communities to permit community-scoped posting in Flow 02.

## Endpoints Exercised
- `POST /api/auth/login` (Admin & User)
- `POST /api/communities` (Admin Guild Creation)
- `POST /api/communities/[slug]/join` (Member Enrollment)

## Execution

```bash
# Forward Seeding (HTTP)
node seeding_scripts/06_communities_flow/bot.js        # Local
node seeding_scripts/06_communities_flow/bot.js prod   # Remote VPS

# Targeted Bot Reset (Deletes seeded communities and memberships)
node seeding_scripts/06_communities_flow/reset.js                     # Local (Prisma)
bash seeding_scripts/06_communities_flow/remote_reset.sh --confirm   # Remote VPS (SSH/Docker stdin)
```

