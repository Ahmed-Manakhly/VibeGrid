# Flow 04 — Engagement (Likes, Replies, Dilemma Votes, Q&A)

## Overview
Generates cross-user engagement on existing seeded posts, including post likes, multi-tier threaded discussions, dilemma poll votes, and post re-grids.

## Scope
- **40 Post Likes:** Distributed across all post types.
- **7 Threaded Discussions:** Multi-tiered comment threads between personas.
- **13 Tech Dilemma Poll Votes:** Distributed voting across options.
- **4 Re-Grids:** Post amplification records.

## Endpoints Exercised
- `POST /api/auth/login`
- `POST /api/posts/[id]/like`
- `POST /api/posts/[id]/comments`
- `POST /api/posts/[id]/poll/vote`
- `POST /api/posts/[id]/regrid`

## Execution

```bash
# Forward Seeding (HTTP)
node seeding_scripts/04_engagement_flow/bot.js        # Local
node seeding_scripts/04_engagement_flow/bot.js prod   # Remote VPS

# Targeted Bot Reset (Deletes likes, comments, poll votes, and regrids)
node seeding_scripts/04_engagement_flow/reset.js                     # Local (Prisma)
bash seeding_scripts/04_engagement_flow/remote_reset.sh --confirm   # Remote VPS (SSH/Docker stdin)
```

