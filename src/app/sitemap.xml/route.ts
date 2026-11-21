import { siteConfig } from '@/lib/seo';
import { prisma } from '@/shared/infrastructure/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const baseUrl = siteConfig.url;

  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'hourly' },
    { path: '/explore', priority: 0.9, changeFrequency: 'hourly' },
    { path: '/communities', priority: 0.8, changeFrequency: 'daily' },
    { path: '/login', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/register', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/settings?tab=policy', priority: 0.5, changeFrequency: 'monthly' },
  ];

  const urls: Array<{
    url: string;
    lastModified: Date;
    changeFrequency: string;
    priority: number;
  }> = [];

  // 1. Core Static Pages
  staticPages.forEach((page) => {
    urls.push({
      url: `${baseUrl}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  });

  // 2. Dynamic Posts / Vibes
  try {
    const posts = await prisma.post.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      select: { id: true, updatedAt: true, createdAt: true },
    });
    posts.forEach((post) => {
      urls.push({
        url: `${baseUrl}/explore/${post.id}`,
        lastModified: new Date(post.updatedAt || post.createdAt),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    });
  } catch (error) {
    console.error('[Sitemap] Failed to fetch dynamic posts:', error);
  }

  // 3. Dynamic Communities / Guilds
  try {
    const communities = await prisma.community.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
      select: { slug: true, updatedAt: true, createdAt: true },
    });
    communities.forEach((comm) => {
      urls.push({
        url: `${baseUrl}/communities/${comm.slug}`,
        lastModified: new Date(comm.updatedAt || comm.createdAt),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    });
  } catch (error) {
    console.error('[Sitemap] Failed to fetch dynamic communities:', error);
  }

  // 4. Dynamic Developer Profiles
  try {
    const users = await prisma.user.findMany({
      take: 500,
      where: { username: { not: '' } },
      orderBy: { createdAt: 'desc' },
      select: { username: true, updatedAt: true, createdAt: true },
    });
    users.forEach((user) => {
      if (user.username) {
        urls.push({
          url: `${baseUrl}/profile/${user.username}`,
          lastModified: new Date(user.updatedAt || user.createdAt),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    });
  } catch (error) {
    console.error('[Sitemap] Failed to fetch dynamic users:', error);
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastModified.toISOString()}</lastmod>
    <changefreq>${u.changeFrequency}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
