# Database Design

## Technology Stack

- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma

## Schema Overview

The database strictly follows a relational model. Below are the key performance considerations and indexing strategies applied to the core tables:

### Indexing Strategy

- **`User` Table:** Unique indexes on `username`, `email`, and `clerkId` for fast lookups during authentication and profile routing.
- **`Post` Table:** B-Tree index on `createdAt` (descending) to optimize feed queries.
- **`Comment` Table:** Composite index on `[authorId, postId]` to speed up fetching user-specific comments on a post.
- **`Like` Table:** Unique composite index on `[userId, postId]` to prevent duplicate likes and optimize "hasLiked" checks.
- **`Follows` Table:** Composite primary key `[followerId, followingId]` for fast social graph traversals.
- **`Notifications` Table:** Index on `[userId, postId]` for fast unread counts.

## Future Data Migration Rules

- No cross-bounded-context foreign keys if we ever decide to extract microservices (though currently enforced via Prisma).
- All deletes must cascade carefully to prevent orphaned records (already configured via `onDelete: Cascade` in Prisma).
