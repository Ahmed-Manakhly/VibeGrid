const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedUsersAndPosts() {
  console.log("🌱 Seeding Users and Posts...");

  // Create a mock user
  const user = await prisma.user.upsert({
    where: { clerkId: "seeder_user_1" },
    update: {},
    create: {
      clerkId: "seeder_user_1",
      email: "seeder1@vibegrid.local",
      username: "tech_guru",
      name: "Tech Guru",
      bio: "Just seeding some data",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=tech_guru",
    },
  });
  console.log(`✅ User: ${user.username}`);

  // Fetch some categories and vibes
  const techCategory = await prisma.category.findUnique({ where: { slug: "tech" } });
  const excitedVibe = await prisma.vibe.findUnique({ where: { key: "excited" } });

  if (!techCategory || !excitedVibe) {
    console.error("❌ Run taxonomy seed first!");
    return;
  }

  // Create a post
  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      content: "Just shipped a new feature! #ReactJS #NextJS",
      categoryId: techCategory.id,
      vibeId: excitedVibe.id,
      tags: {
        create: [
          { tag: { connectOrCreate: { where: { slug: "reactjs" }, create: { name: "ReactJS", slug: "reactjs" } } } },
          { tag: { connectOrCreate: { where: { slug: "nextjs" }, create: { name: "NextJS", slug: "nextjs" } } } },
        ]
      }
    },
  });

  console.log(`✅ Post created with ID: ${post.id}`);
  console.log("🎉 Users and posts seeding complete!");
}

seedUsersAndPosts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
