# Raw Database Wipers (Disaster Recovery & Bare Metal Wipes)

> **⚠️ WARNING:** Scripts in this folder are **RAW INFRASTRUCTURE WIPERS**, not seeding resets.  
> They execute nuclear truncations on production or development datastores, destroying **100% of all data** (real manual users, bot personas, posts, comments, chats, media metadata).

---

## What is in this directory:

1. **`wipe_postgres_redis.js`**:
   - Directly connects to PostgreSQL via Prisma.
   - Truncates all 27 Prisma tables in reverse foreign key dependency order.
   - Connects to Redis and flushes all keys (`flushdb`).
   - Supports `--confirm` and `--include-admins`.
   - Has **zero knowledge** of `data_input.json` or `data_reference.json`.

2. **`remote_wipe_raw_db.sh`**:
   - Executes the 3 raw database wipers sequentially on the production VPS over SSH:
     1. `docker exec vibegrid_auth node scripts/clean_mongo.js --include-admins`
     2. `docker restart vibegrid_auth` (triggers clean bootstrap admin re-seed)
     3. `docker exec vibegrid_media node scripts/clean_media_mongo.js`
     4. `docker exec -i vibegrid_bff node - --confirm --include-admins < wipe_postgres_redis.js`

---

## Difference between Raw Wiping and Seeding Reset:

| Feature | Raw Database Wiper (`raw_db_wipers/`) | Bot Seeding Reset (`reset_all.js` / `remote_reset_all.sh`) |
| :--- | :--- | :--- |
| **Data Scope** | 100% of all data destroyed | **Targeted:** Only bot fixtures deleted |
| **Real Manual UI Users** | ❌ Destroyed | ✅ **Protected & Preserved** |
| **`data_input.json`** | Ignored (untouched) | **Replenished from `data_reference.json`** |
| **Use Case** | Greenfield disaster recovery, fresh environment bootstrap | Routine testing, re-running bot feature flows |

