# Architecture Impact Report — Transactional Outbox + Outbox Relay + RabbitMQ Pipeline

> **Document Location:** `docs/architecture/transactional-outbox-impact.md`  
> **Date:** September 4, 2026  
> **Status:** APPROVED & ACTIVE  

---

## 1. Executive Summary

This document details the architecture design and impact of introducing a **production-grade Transactional Outbox Pattern** and **Outbox Relay Worker** into the VibeGrid platform.

Currently, domain events in the BFF (`src/modules/*`) are dispatched via an `InMemoryEventBus`. If a process crashes, or if a database transaction rolls back after an in-memory event is fired, or if message queue publishing fails during a database write, data inconsistency occurs between the database source of truth and async downstream consumers (`services/email`, `services/onboarding`, `services/notification`).

The **Transactional Outbox Pattern** guarantees **atomic event persistence** with domain state mutations in PostgreSQL, and **at-least-once delivery** to RabbitMQ via an autonomous **Outbox Relay Worker**.

---

## 2. Current State vs. Target State Architecture

### Current State (In-Memory Event Bus)
```text
HTTP Request ──► UseCase ──► DB Mutation (Prisma Commit)
                            └──► InMemoryEventBus ──► NotificationEventHandler (Transient)
```
*Risk*: Database mutation succeeds, but event is lost on crash/restart; or event triggers, but DB transaction rolls back.

### Target State (Transactional Outbox & Outbox Relay)
```text
HTTP Request ──► UseCase ──► BEGIN Prisma DB Transaction
                               ├── DB Mutation (User, Post, Like, Comment, Follow)
                               └── INSERT OutboxEvent (Status: PENDING)
                             COMMIT
                                  │
                                  ▼ (PostgreSQL Outbox Table)
                       [ Outbox Relay Worker ]
                                  │ (FOR UPDATE SKIP LOCKED Claim)
                                  ▼
                    [ RabbitMQ Exchange: domain.events ] (Publisher Confirms)
                         │                 │                 │
                         ▼                 ▼                 ▼
                   q.email         q.user.onboarding   Future Workers
                (services/email)  (services/onboarding)
```

---

## 3. Core Components & Affected Areas

### A. Domain & Persistence Layer (Prisma & PostgreSQL)
1. **`OutboxEvent` Prisma Model**:
   - Fields: `id`, `eventId`, `eventType`, `aggregateType`, `aggregateId`, `payload` (JSONB), `occurredAt`, `status` (`PENDING`, `CLAIMED`, `PUBLISHED`, `FAILED`), `attempts`, `availableAt`, `publishedAt`, `lastError`, `createdAt`, `updatedAt`.
   - Indexing: `@@index([status, availableAt])`, `@@index([createdAt])`, `@@index([aggregateId])`.

2. **Domain Concept**:
   - `OutboxEvent` domain entity (`src/shared/domain/outbox/OutboxEvent.ts`).
   - Clean Architecture ports: `IOutboxRepository` (`append`, `claimBatch`, `markPublished`, `markFailed`, `releaseLease`).

### B. Use Case & Unit of Work Layer (BFF)
1. **Transaction-Aware Event Dispatching**:
   - `TransactionalOutboxEventBus` implementing `IEventBus`.
   - Extends existing domain use cases (`CreateVibeUseCase`, `ToggleFollowUseCase`, `ToggleLikeUseCase`, `AddCommentUseCase`) to execute domain mutation and outbox event append inside a single Prisma `$transaction`.

### C. Outbox Relay Worker (`src/workers/OutboxRelayWorker.ts`)
1. **Concurrency Control**:
   - Uses PostgreSQL `FOR UPDATE SKIP LOCKED` raw query via Prisma to atomically claim batches of pending outbox events across multiple worker instances without lock contention.
2. **RabbitMQ Publisher Confirms**:
   - Connects to `domain.events` exchange (`topic`, `durable: true`).
   - Enables publisher confirmation (`confirmChannel.publish`) before marking events as `PUBLISHED`.
3. **Bounded Retry & Backoff**:
   - Exponential backoff with 10% jitter for failed publication attempts.
   - Transitions to `FAILED` status after `maxAttempts` (default: 5).

### D. Downstream Microservices Compatibility
- **`services/email`**: Consumes `user.registered`, `email.verification.requested`, `password.reset.requested` from `domain.events` exchange.
- **`services/onboarding`**: Consumes `user.registered` from `domain.events` exchange.
- **Idempotency**: Downstream workers retain their two-phase claim check in Redis (`acquireClaim`/`markCompleted`), ensuring at-least-once delivery safety.

---

## 4. Operational & Reliability Guarantees

| Capability | Guarantee Mechanism |
| :--- | :--- |
| **Atomicity** | DB mutation + `OutboxEvent` insertion in single PostgreSQL `$transaction`. Rollback on either failure. |
| **Delivery Guarantee** | At-least-once delivery to RabbitMQ via Outbox Relay. |
| **Concurrency Safety** | `FOR UPDATE SKIP LOCKED` row-level claiming prevents duplicate processing across multiple relay nodes. |
| **Publisher Confirmation** | Events marked `PUBLISHED` only after RabbitMQ broker sends ACK confirmation. |
| **Idempotency** | Downstream consumers utilize `eventId` deduplication via Redis. |

---

## 5. Verification Plan

1. **Prisma Migration**: Run `npx prisma db push` or `npx prisma migrate dev`.
2. **Unit Tests**: Test `OutboxEvent` entity, `PrismaOutboxRepository`, `OutboxRelayWorker` retry calculations, and payload serialization.
3. **Integration & Concurrency Tests**: Verify atomic rollback, `FOR UPDATE SKIP LOCKED` claiming across parallel processes, and publisher confirms.
4. **End-to-End Verification**: Execute domain actions (`CreateVibe`, `ToggleFollow`, `RegisterUser`), observe `OutboxEvent` state transition from `PENDING` $\rightarrow$ `CLAIMED` $\rightarrow$ `PUBLISHED`, and confirm consumption by `services/email` and `services/onboarding`.
5. **Seeding Flow Regression**: Run `node seeding_scripts/run_all.js` to ensure 100% seeding flow compatibility.
