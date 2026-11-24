# Flow 00 — Taxonomy (Categories & Vibes) Seeding

## Overview
Seeds the platform's core system taxonomy (Categories and Vibes) strictly via public HTTP REST Ingress by authenticating as the platform admin.

## Scope
- **15 Technical & Developer Categories:** (Tech, AI & ML, Backend, Frontend, DevOps, Database, System Design, Security, Business, Culture, Design, Lifestyle, Mobile, Productivity, Startups).
- **12 Dynamic Vibes:** (Building, Shipping, Learning, Debugging, Exploring, Questioning, Sharing, Celebrating, Brainstorming, Ranting, Reviewing, Announcing).
- **Cache Management:** Automatically invalidates Redis `cache:tags:all` upon completion.

## Endpoints Exercised
- `POST /api/auth/login` — Platform Admin authentication
- `POST /api/taxonomy/categories` — Category creation & verification
- `POST /api/taxonomy/vibes` — Vibe creation & verification

## Execution

```bash
# Forward Seeding (HTTP)
node seeding_scripts/00_taxonomy_flow/bot.js        # Local
node seeding_scripts/00_taxonomy_flow/bot.js prod   # Remote VPS

# Targeted Bot Reset (Deletes seeded taxonomy records, refills queue)
node seeding_scripts/00_taxonomy_flow/reset.js                     # Local (Prisma)
bash seeding_scripts/00_taxonomy_flow/remote_reset.sh --confirm   # Remote VPS (SSH/Docker stdin)
```
