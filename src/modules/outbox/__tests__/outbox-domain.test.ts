import { OutboxEvent } from "../domain/OutboxEvent";

describe("OutboxEvent Domain Entity", () => {
  it("should instantiate with default PENDING status and valid timestamps", () => {
    const event = new OutboxEvent({
      eventId: "evt_101",
      eventType: "vibe.created",
      aggregateType: "Post",
      aggregateId: "post_500",
      payload: { content: "Test post" },
    });

    expect(event.eventId).toBe("evt_101");
    expect(event.status).toBe("PENDING");
    expect(event.attempts).toBe(0);
    expect(event.publishedAt).toBeNull();
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it("should update status to PUBLISHED on markPublished()", () => {
    const event = new OutboxEvent({
      eventId: "evt_102",
      eventType: "user.followed",
      aggregateType: "User",
      aggregateId: "user_200",
      payload: { followerId: "u1", followingId: "u2" },
      claimedBy: "worker_1",
    });

    event.markPublished();

    expect(event.status).toBe("PUBLISHED");
    expect(event.publishedAt).toBeInstanceOf(Date);
    expect(event.claimedBy).toBeNull();
  });

  it("should increment attempts and schedule retry on markFailed()", () => {
    const event = new OutboxEvent({
      eventId: "evt_103",
      eventType: "comment.added",
      aggregateType: "Comment",
      aggregateId: "cmt_300",
      payload: { text: "Nice post!" },
    });

    const nextAvailable = new Date(Date.now() + 5000);
    event.markFailed("Connection reset", nextAvailable);

    expect(event.attempts).toBe(1);
    expect(event.lastError).toBe("Connection reset");
    expect(event.availableAt).toBe(nextAvailable);
    expect(event.status).toBe("PENDING");
  });

  it("should mark status as FAILED when max attempts (5) are reached", () => {
    const event = new OutboxEvent({
      eventId: "evt_104",
      eventType: "like.toggled",
      aggregateType: "Post",
      aggregateId: "post_100",
      payload: { likerId: "u1" },
      attempts: 4,
    });

    const nextAvailable = new Date(Date.now() + 10000);
    event.markFailed("Max retries exceeded", nextAvailable);

    expect(event.attempts).toBe(5);
    expect(event.status).toBe("FAILED");
  });

  it("should transform to canonical envelope format", () => {
    const event = new OutboxEvent({
      eventId: "evt_105",
      eventType: "user.registered",
      aggregateType: "User",
      aggregateId: "user_999",
      payload: { email: "test@vibegrid.tech", name: "Test User" },
      occurredAt: new Date("2026-09-04T12:00:00Z"),
    });

    const envelope = event.toCanonicalEnvelope(1, "corr_123");

    expect(envelope).toEqual({
      eventId: "evt_105",
      eventName: "user.registered",
      version: 1,
      timestamp: "2026-09-04T12:00:00.000Z",
      correlationId: "corr_123",
      payload: {
        email: "test@vibegrid.tech",
        name: "Test User",
        aggregateId: "user_999",
        aggregateType: "User",
      },
    });
  });
});
