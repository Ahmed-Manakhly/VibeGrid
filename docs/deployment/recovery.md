# VibeGrid — Backup & Disaster Recovery Guide

## 1. Overview

This document specifies the disaster recovery, database backup, data volume restoration, and operational fallback strategies for the VibeGrid platform.

---

## 2. PostgreSQL Backup & Recovery Strategy

### Automated Nightly Logical Backups (`pg_dump`)

A cron job runs on the host VPS to perform automated nightly `pg_dump` compressed backups:

```bash
#!/bin/bash
# Backup Script: /usr/local/bin/backup-vibegrid-postgres.sh
BACKUP_DIR="/var/backups/vibegrid/postgres"
TIMESTAMP=$(date +"%Y%m%m_%H%M%S")
mkdir -p "$BACKUP_DIR"

docker exec -t vibegrid-postgres pg_dump -U postgres -d vibegrid_db -F c -b -v -f "/tmp/vibegrid_${TIMESTAMP}.dump"
docker cp vibegrid-postgres:"/tmp/vibegrid_${TIMESTAMP}.dump" "${BACKUP_DIR}/vibegrid_${TIMESTAMP}.dump"
docker exec -t vibegrid-postgres rm "/tmp/vibegrid_${TIMESTAMP}.dump"

# Retain last 14 days of dumps
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +14 -delete
```

### PostgreSQL Point-In-Time Restoration

To restore from a logical dump:

```bash
# 1. Stop active BFF to terminate open pool connections
docker stop vibegrid-bff

# 2. Re-create database shell
docker exec -it vibegrid-postgres dropdb -U postgres vibegrid_db
docker exec -it vibegrid-postgres createdb -U postgres vibegrid_db

# 3. Restore dump
docker cp /var/backups/vibegrid/postgres/vibegrid_YYYYMMDD.dump vibegrid-postgres:/tmp/restore.dump
docker exec -it vibegrid-postgres pg_restore -U postgres -d vibegrid_db /tmp/restore.dump

# 4. Restart BFF
docker start vibegrid-bff
```

---

## 3. MongoDB Backup Strategy (Auth & Metadata)

```bash
# Export Auth collection
docker exec -t vibegrid-mongodb mongodump --db vibegrid-auth --out /tmp/mongodump
docker cp vibegrid-mongodb:/tmp/mongodump /var/backups/vibegrid/mongodb/

# Restore Auth collection
docker cp /var/backups/vibegrid/mongodb/mongodump vibegrid-mongodb:/tmp/mongodump
docker exec -it vibegrid-mongodb mongorestore --db vibegrid-auth /tmp/mongodump/vibegrid-auth
```

---

## 4. MinIO Object Storage & Log Archival Persistence

1. **Volume Mounts**: MinIO data is persisted on host volume `minio_data` mapped to `/data` inside container.
2. **Media Bucket (`vibegrid-media`)**: Synchronized to secondary S3 or offline backup daily via `mc mirror`:

   ```bash
   mc mirror --overwrite minio/vibegrid-media /var/backups/vibegrid/minio-media/
   ```

3. **Log Archival Bucket (`vibegrid-logs`)**: Immutable rotated JSON logs retained under `logs/<service>/YYYY/MM/DD/`.

---

## 5. Redis & RabbitMQ Recovery Expectations

- **Redis**: Persistent via AOF (`appendonly yes`) & RDB snapshots (`dump.rdb`). On crash recovery, Redis reloads state from disk (Timeline keys, Rate limit tokens, Presence).
- **RabbitMQ**: Exchanges (`domain.events`) and queues (`q.timeline.fanout`, `q.notifications.push`, `q.search.indexing`, `q.email`, `q.user.onboarding`, `q.dlq`) are declared **durable**. Unacknowledged messages persist on container restart.

---

## 6. Secrets & Environment Restoration

1. Secrets must **never** be committed to Git.
2. Production environment variables are backed up to a secure password-manager store (`.env.production.encrypted`).
3. To recover an environment node:

   ```bash
   gpg --decrypt .env.production.encrypted > /home/deploy/VibeGrid_Services/.env
   ```
