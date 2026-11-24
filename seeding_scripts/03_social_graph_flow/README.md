# Flow 03 — Dense Social Graph (Follow Relationships)

## Overview
Establishes bidirectional and directional follow relationships across the 8 developer personas to generate an active, personalized home feed graph.

## Scope
- **21 Follow Edges:** Pre-configured matrix ensuring every persona has followers and following feeds.
- **Session Verification:** Verifies social session state and profile statistics via `/api/auth/me`.

## Endpoints Exercised
- `POST /api/auth/login`
- `POST /api/social/follow` (Toggle follow connection)
- `GET /api/auth/me` (Graph state validation)

## Execution

```bash
# Forward Seeding (HTTP)
node seeding_scripts/03_social_graph_flow/bot.js        # Local
node seeding_scripts/03_social_graph_flow/bot.js prod   # Remote VPS

# Targeted Bot Reset (Deletes only seeded bot Follow relationships)
node seeding_scripts/03_social_graph_flow/reset.js                     # Local (Prisma)
bash seeding_scripts/03_social_graph_flow/remote_reset.sh --confirm   # Remote VPS (SSH/Docker stdin)
```

