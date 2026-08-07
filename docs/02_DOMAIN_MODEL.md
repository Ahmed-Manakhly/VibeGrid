# Domain Model

## Core Entities & Value Objects

### 1. User

- **Attributes:** ID, Email, Username, Bio, Location, Website, Avatar
- **Relationships:** Has many Posts, Comments, Likes, Followers, Following.

### 2. Post

- **Attributes:** ID, Content, Image, CreatedAt
- **Relationships:** Belongs to Author (User), Has many Comments, Likes.

### 3. Comment

- **Attributes:** ID, Content, CreatedAt
- **Relationships:** Belongs to Author (User) and Post.

### 4. Like

- **Attributes:** ID, CreatedAt
- **Relationships:** Belongs to User and Post.

### 5. Follows

- **Attributes:** FollowerId, FollowingId, CreatedAt
- **Relationships:** Links two Users.

### 6. Notification

- **Attributes:** ID, Type (LIKE, COMMENT, FOLLOW), Read Status
- **Relationships:** Belongs to Recipient (User), Triggered by Actor (User), References Post/Comment.

## Bounded Contexts

1. **Identity & Access Management (IAM):** Users, Sessions, Authentication.
2. **Social Graph:** Follows, User Relationships.
3. **Content Publishing:** Posts, Feed generation.
4. **Engagement:** Comments, Likes.
5. **Notifications:** Alert dispatching and state tracking.
