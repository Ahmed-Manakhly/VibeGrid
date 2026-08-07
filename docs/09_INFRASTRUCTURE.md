# Infrastructure

## Current Deployment (Phase 1-5)

- **Frontend / Backend:** Vercel (Serverless Next.js).
- **Database:** Neon (Serverless PostgreSQL).
- **Image Hosting:** UploadThing.

## Target Deployment (Phase 6)

In Phase 6, VibeGrid will transition from PaaS to full IaaS to reduce costs and increase control.

### The VPS Architecture

- **Host:** Dedicated VPS (e.g., Hostinger, DigitalOcean, Hetzner).
- **Containerization:** Docker & Docker Compose.
  - `web`: Next.js Node server (Standalone build).
  - `db`: PostgreSQL container.
  - `redis`: Redis container for caching and BullMQ.
  - `proxy`: Nginx or Traefik for reverse proxying, SSL termination, and rate limiting.
- **CI/CD:** GitHub Actions to build the Docker image, push to a registry, and trigger a pull on the VPS via a webhook or SSH command.
- **Storage:** MinIO (S3-compatible object storage) running on the VPS to replace UploadThing.

## Monitoring

- **Error Tracking:** Sentry.
- **Logs:** Winston/Pino streaming to a centralized logging solution (or standard stdout in Docker).
