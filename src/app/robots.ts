import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/explore', '/communities', '/profile', '/settings'],
        disallow: [
          '/messages',
          '/messages/*',
          '/notifications',
          '/notifications/*',
          '/bookmarks',
          '/bookmarks/*',
          '/api',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

