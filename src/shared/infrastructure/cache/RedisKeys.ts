export class RedisKeys {
  public static timeline(userId: string): string {
    return `timeline:${userId}`;
  }

  public static tagsAll(): string {
    return `cache:tags:all`;
  }

  public static vibesTag(tag: string): string {
    return `cache:vibes:tag:${tag}`;
  }

  public static user(username: string): string {
    return `cache:user:${username.toLowerCase()}`;
  }

  public static post(postId: string): string {
    return `cache:post:${postId}`;
  }

  public static lockOutboxRelay(): string {
    return `lock:outbox:relay`;
  }

  public static lockKey(resource: string): string {
    return `lock:${resource}`;
  }

  public static ratelimit(ip: string, route: string): string {
    const cleanRoute = route.replace(/[^a-zA-Z0-9_/.-]/g, '_');
    return `ratelimit:${ip}:${cleanRoute}`;
  }
}

export const CACHE_TTL = {
  TIMELINE: 24 * 60 * 60, // 24h
  TAGS_ALL: 60 * 60,      // 1h
  VIBES_TAG: 15 * 60,     // 15m
  USER: 30 * 60,          // 30m
  POST: 60 * 60,          // 1h
} as const;
