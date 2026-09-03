/**
 * FLOW 00 — Taxonomy & Categories Bot
 * ============================================================
 * Seeds Categories + Vibes using Prisma directly into PostgreSQL.
 *
 * Usage:
 *   node seeding_scripts/00_taxonomy_flow/bot.js
 * ============================================================
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const REFERENCE_PATH = path.join(__dirname, 'data_reference.json');

async function seedTaxonomy() {
  console.log('🌱 FLOW 00: Seeding Taxonomy (Categories & Vibes)...');

  if (!fs.existsSync(REFERENCE_PATH)) {
    throw new Error(`Reference file missing at ${REFERENCE_PATH}`);
  }

  const data = JSON.parse(fs.readFileSync(REFERENCE_PATH, 'utf8'));

  // 1. Seed Categories
  let catCount = 0;
  for (const cat of data.categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    catCount++;
  }
  console.log(`   ✅ Categories — seeded/updated ${catCount} records`);

  // 2. Seed Vibes
  let vibeCount = 0;
  for (const vibe of data.vibes) {
    await prisma.vibe.upsert({
      where: { key: vibe.key },
      update: vibe,
      create: vibe,
    });
    vibeCount++;
  }
  console.log(`   ✅ Vibes — seeded/updated ${vibeCount} records`);

  console.log('🎉 Flow 00: Taxonomy seeding complete!\n');
}

seedTaxonomy()
  .catch((e) => {
    console.error('❌ Flow 00 failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
