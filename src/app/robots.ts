import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url.replace(/\/$/, '');
  const privateDisallows = [
    '/api/',
    '/settings/',
    '/messages/',
    '/notifications/',
    '/bookmarks/',
    '/onboarding/',
    '/_next/',
  ];

  return {
    rules: [
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'PerplexityBot', 'AnthropicAI', 'Google-Extended'],
        allow: ['/'],
        disallow: privateDisallows,
      },
      {
        userAgent: ['CCBot', 'OAI-SearchBot'],
        disallow: ['/'],
      },
      {
        userAgent: '*',
        allow: ['/', '/explore', '/communities', '/profile'],
        disallow: [
          ...privateDisallows,
          '/static/',
          '/*?*token=',
          '/*?*auth=',
          '/*?*key=',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

