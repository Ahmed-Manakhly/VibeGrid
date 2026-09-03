/**
 * DB Cleaner — README
 * ==========================================================
 * Scope / Impact table for each cleaner script.
 *
 * ⚠️  IMPORTANT: All cleaners use Prisma to directly
 *     connect to PostgreSQL. They must be run from a machine
 *     that has DATABASE_URL configured in .env.
 *
 * Command                                    | Scope
 * -------------------------------------------|-----------------------------------
 * node db_cleaners/clean_all.js --confirm    | ⚠️ Everything EXCEPT Admin user
 * node db_cleaners/clean_users.js --confirm  | All non-admin Users + cascade
 * node db_cleaners/clean_posts.js --confirm  | All Posts + Comments/Likes/Tags
 * node db_cleaners/clean_taxonomy.js --confirm | Categories, Vibes, Tags
 * ==========================================================
 */
