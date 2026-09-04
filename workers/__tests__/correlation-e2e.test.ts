import { OutboxEvent } from "@/modules/outbox/domain/OutboxEvent";

describe("Correlation ID Propagation Tests", () => {
  it("should preserve correlationId in OutboxEvent payload and envelope DTO metadata", () => {
    const correlationId = "req-test-uuid-99999";

    const event = new OutboxEvent({
      eventId: "evt-999",
      aggregateType: "vibe",
      aggregateId: "post-123",
      eventType: "vibe.created",
      payload: {
        vibeId: "post-123",
        authorId: "user-789",
        correlationId,
      },
    });

    const envelope = event.toCanonicalEnvelope(1, correlationId);

    expect(envelope.correlationId).toBe(correlationId);
    expect(envelope.payload).toMatchObject({
      vibeId: "post-123",
      authorId: "user-789",
      correlationId,
    });
  });
});
