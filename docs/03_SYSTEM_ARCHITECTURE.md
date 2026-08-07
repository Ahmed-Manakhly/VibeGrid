# System Architecture

## Architecture Style: Modular Monolith

The system will be strictly divided into domain modules inside `src/modules/`. Cross-module communication must happen via public interfaces or events, not direct database joins across boundaries.

## Layered Design (Clean/Onion Architecture)

Each module will follow a strict inward-pointing dependency rule:

1. **Domain Layer (`/domain`):** Entities, Enums, and Repository Interfaces. (Zero external dependencies).
2. **Application Layer (`/application`):** Use cases, CQRS Commands/Queries, and DTOs.
3. **Infrastructure Layer (`/infrastructure`):** Prisma implementations, 3rd-party integrations (Clerk, UploadThing).
4. **Presentation Layer (`/presentation`):** Next.js Server Actions, API Routes, React Components.

## Communication Patterns

- **Synchronous:** Within the same module via direct function calls.
- **Asynchronous (Event-Driven):** Across modules via an Event Bus (e.g., `PostCreatedEvent` triggers the Notification module).
