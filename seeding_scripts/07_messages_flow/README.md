# Flow 07 — Direct Messaging & Conversations (1-on-1)

## Overview
Seeds private 1-on-1 direct conversations and multi-turn message exchanges between developer personas, verifying conversation indexing and message delivery over HTTP.

## Scope
- **3 Active Private Threads:**
  - Omar Farooq $\leftrightarrow$ Sarah Chen (Benchmark traces & Redis sliding window)
  - Youssef Dev $\leftrightarrow$ Omar Farooq (Tokio SSE channel backpressure)
  - Elena Rostova $\leftrightarrow$ Maya Lin (Inline theme script & hydration)
- **Multi-Turn Chat History:** Multiple messages exchanged per thread.

## Endpoints Exercised
- `POST /api/auth/login`
- `POST /api/messages/conversations` (Initialize or fetch conversation)
- `POST /api/messages/conversations/[id]/messages` (Send direct message)
- `GET /api/messages/conversations` (Verify conversation list)

## Execution

```bash
# Forward Seeding (HTTP)
node seeding_scripts/07_messages_flow/bot.js        # Local
node seeding_scripts/07_messages_flow/bot.js prod   # Remote VPS

# Targeted Bot Reset (Deletes seeded conversations, participants, and direct messages)
node seeding_scripts/07_messages_flow/reset.js                     # Local (Prisma)
bash seeding_scripts/07_messages_flow/remote_reset.sh --confirm   # Remote VPS (SSH/Docker stdin)
```
