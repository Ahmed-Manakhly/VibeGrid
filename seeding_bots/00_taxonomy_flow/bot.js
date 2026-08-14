const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const categories = [
  { name: "Design", slug: "design", emoji: "🎨" },
  { name: "Tech", slug: "tech", emoji: "💻" },
  { name: "Culture", slug: "culture", emoji: "🌍" },
  { name: "Business", slug: "business", emoji: "💼" },
  { name: "Productivity", slug: "productivity", emoji: "⚡" },
  { name: "Startups", slug: "startups", emoji: "🚀" },
  { name: "Lifestyle", slug: "lifestyle", emoji: "🌿" },
];

const vibes = [
  { key: "excited", label: "🚀 Excited" },
  { key: "learning", label: "📚 Learning" },
  { key: "building", label: "💻 Building" },
  { key: "debugging", label: "🐛 Debugging" },
  { key: "chill", label: "☕ Chill" },
];

async function seedTaxonomy() {
  console.log("🌱 Seeding Taxonomy...");

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    console.log(`✅ Category: ${cat.name}`);
  }

  for (const vibe of vibes) {
    await prisma.vibe.upsert({
      where: { key: vibe.key },
      update: vibe,
      create: vibe,
    });
    console.log(`✅ Vibe: ${vibe.label}`);
  }

  console.log("🎉 Taxonomy seeding complete!");
}

seedTaxonomy()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
