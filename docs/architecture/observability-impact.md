# Architecture Impact Report — Structured Pino Logger + Correlation-ID Threading + MinIO Log Archival

> **Document Location:** `docs/architecture/observability-impact.md`  
> **Date:** September 5, 2026  
> **Status:** APPROVED & ACTIVE  

---

## 1. Executive Summary

This document details the architecture design and impact of introducing a **production-grade structured logger framework (`ILogger` Port)**, **correlation-ID request tracing (`X-Request-ID`)**, and an **autonomous log archival pipeline (`LogArchiveWorker` → MinIO)** into the VibeGrid platform.

Prior to this milestone, application components in both the Next.js BFF (`src/`) and Node.js microservices (`VibeGrid_Services`) relied on uncontrolled `console.*` calls. This posed three major architectural risks:
1. **Lack of Structure & Queryability:** Free-form string output (`console.log("Failed for user " + id)`) cannot be parsed by log aggregators or analytics tools.
2. **Sensitive Data Leakage Risk:** Uncontrolled `console.log` calls could accidentally output JWT access tokens, refresh tokens, passwords, OTP secrets, or credentials.
3. **Broken Tracing Across Microservices:** A single client HTTP request traversing Nginx Gateway → Next.js BFF → Auth/Media Service → RabbitMQ Async Workers was impossible to correlate end-to-end due to missing header propagation.

---

## 2. Current State vs. Target State Architecture

### Current State (Unstructured Console Output & Disconnected Headers)
```text
HTTP Request (Header: missing X-Request-ID)
   ↓
Nginx Gateway
   ↓
Next.js BFF ────► console.log() [Unstructured, no correlation ID]
   ↓
Auth / Media Microservice ────► console.error() [Independent string logs]
```

### Target State (Structured ILogger + End-to-End Correlation + Decoupled MinIO Archival)
```text
Client HTTP Request
   │
   ▼
Nginx Ingress Proxy (Generates or preserves X-Request-ID)
   │
   ▼ (X-Request-ID)
Next.js BFF (Extracts X-Request-ID into AsyncLocalStorage / Request Context)
   │
   ├─► ILogger Port (PinoLogger Adapter)
   │       ├── Pretty stdout (Development) / JSON stdout (Production)
   │       └── Local Rotated File (/logs/bff-2026-09-05.log via pino-roll)
   │
   ▼ (Forwards X-Request-ID header)
Microservice / Worker (Auth, Media, Email, Onboarding, Outbox Relay)
   │
   ├─► ILogger Port (Shared Pino Logger Package)
   │       ├── JSON stdout (Docker)
   │       └── Local Rotated File (/logs/<service>-2026-09-05.log)
   │
   ▼ (Decoupled Background Execution)
LogArchiveWorker (Scans completed rotated log files)
   │
   ▼ (S3 API Upload)
MinIO Cold Storage (/vibegrid-logs/logs/<service>/YYYY/MM/DD/<filename>.log.gz)
```

---

## 3. Key Design Choices & Principles

### A. Clean Architecture & Dependency Inversion
- **Port:** `ILogger` defined in `src/shared/application/ports/ILogger.ts` (BFF) and exported from `@vibegrid/logger` (Microservices).
- **No Domain Coupling:** Domain entity models and use cases depend exclusively on `ILogger`. They have zero awareness of `Pino`, `pino-roll`, or file systems.
- **DI Container Injection:** `PinoLogger` adapter is registered in `di-container.ts` and injected into infrastructure repositories, services, and route handlers.

### B. Automatic Sensitive Field Redaction
Pino serializers automatically mask sensitive paths before writing to streams:
- `authorization` / `headers.authorization`
- `token` / `accessToken` / `refreshToken`
- `password` / `newPassword` / `oldPassword`
- `emailToken` / `otp` / `secret` / `clientSecret`

### C. Decoupled MinIO Log Archival (Zero Request-Path Latency)
- **Non-Blocking:** Logging is strictly localized to in-memory buffers and fast local file system streams (`pino-roll`).
- **LogArchiveWorker:** An autonomous background worker scans for rotated completed log files (`.log` / `.log.gz`), uploads them to MinIO (`vibegrid-logs/logs/<service>/YYYY/MM/DD/`), and deletes the local file upon S3 ACK confirmation.
- **Fault Resilience:** If MinIO is offline, local logs remain safely buffered on disk; application API performance is completely unimpacted.

---

## 4. Canonical Correlation Identifier: `X-Request-ID`

Nginx API Gateway generates `$request_id` if client `X-Request-ID` is missing.
- **BFF Middleware & Route Handlers:** Extract `X-Request-ID` and bind it to request-scoped child logger context (`correlationId`).
- **Outbound Proxies & Microservice Clients:** Propagate `X-Request-ID` in HTTP headers to upstream Auth/Media services.
- **Event Contracts:** Transactional Outbox envelopes preserve `correlationId` in metadata payload for downstream RabbitMQ workers (`q.email`, `q.user.onboarding`).

---

## 5. Backward Compatibility Guarantee

This implementation is strictly additive and cross-cutting:
- **No changes to DB schemas or domain entity logic.**
- **No changes to Auth JWT verification or Media upload contracts.**
- **100% test compatibility maintained across all microservices.**
