export type OutboxStatus = 'PENDING' | 'CLAIMED' | 'PUBLISHED' | 'FAILED';

export interface OutboxEventProps {
  id?: string;
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  occurredAt?: Date;
  status?: OutboxStatus;
  attempts?: number;
  availableAt?: Date;
  publishedAt?: Date | null;
  lastError?: string | null;
  claimedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OutboxEvent {
  public readonly id?: string;
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly aggregateType: string;
  public readonly aggregateId: string;
  public readonly payload: Record<string, any>;
  public readonly occurredAt: Date;
  public status: OutboxStatus;
  public attempts: number;
  public availableAt: Date;
  public publishedAt: Date | null;
  public lastError: string | null;
  public claimedBy: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: OutboxEventProps) {
    this.id = props.id;
    this.eventId = props.eventId;
    this.eventType = props.eventType;
    this.aggregateType = props.aggregateType;
    this.aggregateId = props.aggregateId;
    this.payload = props.payload;
    this.occurredAt = props.occurredAt || new Date();
    this.status = props.status || 'PENDING';
    this.attempts = props.attempts || 0;
    this.availableAt = props.availableAt || new Date();
    this.publishedAt = props.publishedAt || null;
    this.lastError = props.lastError || null;
    this.claimedBy = props.claimedBy || null;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public markPublished(): void {
    this.status = 'PUBLISHED';
    this.publishedAt = new Date();
    this.claimedBy = null;
  }

  public markFailed(error: string, availableAt: Date): void {
    this.attempts += 1;
    this.lastError = error;
    this.availableAt = availableAt;
    this.claimedBy = null;

    if (this.attempts >= 5) {
      this.status = 'FAILED';
    } else {
      this.status = 'PENDING';
    }
  }

  public toCanonicalEnvelope(version = 1, correlationId?: string) {
    return {
      eventId: this.eventId,
      eventName: this.eventType,
      version,
      timestamp: this.occurredAt.toISOString(),
      ...(correlationId ? { correlationId } : {}),
      payload: {
        ...this.payload,
        aggregateId: this.aggregateId,
        aggregateType: this.aggregateType,
      },
    };
  }
}
