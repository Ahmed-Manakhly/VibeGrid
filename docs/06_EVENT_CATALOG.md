# Event Catalog

To decouple modules and support future scalability (e.g., extracting background jobs to BullMQ/Redis), we use an in-process Event Bus for domain events.

## Event Naming Convention

`[Subject][PastTenseVerb]Event` (e.g., `PostCreatedEvent`)

## Catalog

### 1. `UserCreatedEvent`

- **Triggered when:** A new user signs up (via Clerk Webhook).
- **Payload:** `userId`, `email`, `timestamp`
- **Subscribers:** Analytics, Welcome Email Service.

### 2. `PostCreatedEvent`

- **Triggered when:** A user successfully publishes a post.
- **Payload:** `postId`, `authorId`, `timestamp`
- **Subscribers:**
  - `FeedService` (To update follower timelines in Redis - Phase 7)
  - `NotificationService` (If mentioning someone).

### 3. `LikeToggledEvent`

- **Triggered when:** A user likes or unlikes a post.
- **Payload:** `postId`, `userId`, `isLiked`, `timestamp`
- **Subscribers:** `NotificationService` (Dispatches a notification to the post author if `isLiked = true`).

### 4. `CommentAddedEvent`

- **Triggered when:** A user replies to a post.
- **Payload:** `commentId`, `postId`, `authorId`, `timestamp`
- **Subscribers:** `NotificationService` (Dispatches a notification to the post author).

### 5. `UserFollowedEvent`

- **Triggered when:** User A follows User B.
- **Payload:** `followerId`, `followingId`, `timestamp`
- **Subscribers:** `NotificationService` (Dispatches a notification to User B).
