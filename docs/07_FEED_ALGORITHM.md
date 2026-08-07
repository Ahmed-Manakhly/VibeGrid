# Feed Algorithm

Currently, the feed is a simple chronological reverse-lookup of posts from the database. As VibeGrid scales, we will implement a robust Feed Algorithm in Phase 7.

## Current Implementation (Phase 1)

- **Query:** `SELECT * FROM Post ORDER BY createdAt DESC LIMIT 20 OFFSET X;`
- **Pros:** Simple, requires zero background processing.
- **Cons:** Does not scale well when filtering by "Followed users only" for users following thousands of people.

## Future Architecture (Phase 7: Redis timelines)

### The "Merge + Rank" Strategy

```text
               CREATE POST
                   │
                   ▼
            ┌─────────────┐
            │ Event Queue  │
            └──────┬──────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   Normal User          High-Follower User
   < 10k followers      > 10k followers
        │                     │
        ▼                     ▼
  Fan-out-on-write      Fan-out-on-read
        │                     │
        ▼                     ▼
  Redis timelines       Query author's posts
                              │
                              ▼
                       Merge + Rank
```

1. **Fan-out-on-write:** When a normal user posts, the `PostCreatedEvent` triggers a worker that pushes the Post ID into a Redis List for every single follower.
2. **Fan-out-on-read:** When a user with 10k+ followers posts (e.g., an influencer), pushing to 10k Redis lists is too slow. Instead, we query their posts directly on read and merge them into the follower's timeline in memory.
3. **Ranking:** Posts are currently purely chronological. Future iterations may include a decay algorithm based on likes and comments.
