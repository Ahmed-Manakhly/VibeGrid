# Security Model

## 1. Authentication

- **Current:** Managed by **Clerk**. Clerk handles passwords, OAuth, 2FA, and session tokens.
- **Future:** Evaluating migration to a custom Auth.js/Express implementation for full data sovereignty.
- **Session Validation:** Every sensitive Server Action or API Route must call `auth()` to verify the session token.

## 2. Authorization (Row-Level Security Logic)

Since we are using Prisma (which does not natively support Postgres RLS at the ORM level easily), authorization is enforced at the **Application Layer**.

- **Ownership Checks:** Before mutating a resource (editing a post, deleting a comment), the service must verify `resource.authorId === session.userId`.
- **Soft Deletes vs Hard Deletes:** Currently, cascades trigger hard deletes. In the future, we may move to soft deletes (`deletedAt`) to preserve data integrity and prevent accidental data loss.

## 3. Data Validation

- All incoming user data (API bodies, Server Action arguments) MUST be validated using **Zod**.
- No raw SQL execution allowed unless absolutely necessary and heavily parameterized.

## 4. Rate Limiting

- To be implemented in Phase 7 via Redis to prevent spamming the `createPost` and `toggleLike` endpoints.
