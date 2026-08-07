# Execution Plan

VibeGrid is executed in distinct phases. We do not move to a new phase until the "Exit Criteria" of the current phase are met.

## PHASE 1: Stabilize Legacy (COMPLETED)

- App boots without errors.
- Branding locked in (VibeGrid).
- Pre-Code documentation drafted.
- Initial Git repo pushed.

## PHASE 2: Architectural Refactoring

- Implement Modular Monolith structure (`src/modules`).
- Extract Prisma logic into the Repository Pattern.
- Setup the internal Event Bus.
- Implement Dependency Injection principles.

## PHASE 3: Re-Branding

- Refine Tailwind/Shadcn UI to fit the "Developer Pulse" aesthetic.
- Remove generic "X Clone" visuals.
- Lock in final color palettes and typography.

--- **ARCHITECTURE REVIEW GATE** ---

## PHASE 4: Switch Auth (Pending Decision)

- Evaluate moving off Clerk to custom Auth.js/Express.

## PHASE 5: Switch Storage (Pending Decision)

- Evaluate moving off UploadThing to custom S3/MinIO.

## PHASE 6: Switch Deployment

- Containerize the application (Docker).
- Deploy to a custom VPS with Nginx proxy.

## PHASE 7: Add Features

- Implement Socket.io real-time updates.
- Integrate Redis Pub/Sub and BullMQ for background jobs.
- Build the "Merge + Rank" Feed Algorithm.
- Implement payments and localization.
