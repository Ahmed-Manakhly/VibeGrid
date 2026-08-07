# API Contract

Since we are using **Next.js 14 App Router**, our API layer is a hybrid of Server Actions (for mutations) and React Server Components (for data fetching), supplemented by standard REST API routes for webhooks.

## 1. Server Actions (Mutations)

Server actions serve as the entry points to our Application Use Cases.

### `createPost(data: CreatePostDTO): Promise<Result<Post>>`

- Validates input via Zod.
- Calls `PostService.create()`.
- Revalidates path `/` on success.

### `toggleLike(postId: string): Promise<Result<boolean>>`

- Infers user from session.
- Adds or removes a like.
- Triggers `LikeToggledEvent`.

### `followUser(targetUserId: string): Promise<Result<boolean>>`

- Creates a follower relationship.
- Triggers `UserFollowedEvent`.

## 2. Data Fetching (Queries)

- **`getFeed(cursor?: string)`:** Returns a paginated list of posts for the home feed.
- **`getUserProfile(username: string)`:** Fetches user details and their posts.
- **`getNotifications(cursor?: string)`:** Fetches unread/read notifications.

## 3. External Webhooks (API Routes)

- **`POST /api/webhooks/clerk`:** Syncs Clerk user data into our `User` table.
- **`POST /api/uploadthing`:** Handles image upload callbacks.
