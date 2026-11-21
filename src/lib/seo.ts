import type { Metadata } from 'next';

// ============================================================================
// 1. Site Configuration & Brand Constants
// ============================================================================
export const siteConfig = {
  name: "VibeGrid",
  description:
    "Real-time Tech Newsfeed / Developer Pulse. Drop a Vibe, tune in to developer discussions, join tech guilds, and share code snippets.",
  url: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.vibegrid.manakhly.tech",
  ogImage: "/icon-512.png",
  twitterCard: "summary_large_image" as const,
  twitterSite: "@vibegrid",
  twitterCreator: "@vibegrid",
  locale: "en_US",
  siteType: "website",
  copyright: `© 2024–${new Date().getFullYear()} VibeGrid. All rights reserved.`,
  keywords: [
    "developer",
    "tech news",
    "programming",
    "software engineering",
    "nextjs",
    "react",
    "typescript",
    "open source",
    "code snippets",
    "tech community",
    "developer pulse",
    "tech guilds"
  ],
  author: "VibeGrid",
  publisher: "VibeGrid Tech",
  category: "Technology",
  founded: "2024",
  headquarters: "San Francisco, CA"
};

// ============================================================================
// 2. Open Graph & Absolute HTTPS Thumbnail Resolution
// ============================================================================

/**
 * Returns the HTTPS base for uploaded media.
 * WhatsApp, Facebook, LinkedIn require strictly absolute HTTPS URLs.
 */
export function getOgMediaBase(): string {
  const prod = process.env.IMG_BASE_API_PROD || process.env.NEXT_PUBLIC_MEDIA_URL;
  if (prod && /^https?:\/\//i.test(prod)) {
    return prod.endsWith('/') ? prod : `${prod}/`;
  }
  const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || siteConfig.url).replace(/\/$/, '');
  return `${site}/`;
}

/**
 * Validates whether an image path string is usable for Open Graph previews.
 */
export function isValidOgImagePath(path?: string | null): boolean {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  if (/imgHolder/i.test(trimmed)) return false;
  return true;
}

/**
 * Resolves any relative, upload, or absolute image path to an absolute HTTPS URL.
 * Compliant with WhatsApp, LinkedIn, Twitter/X, and Facebook Open Graph standards.
 */
export function resolveOgImageUrl(image?: string | null): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || siteConfig.url).replace(/\/$/, '');
  const fallback = process.env.OG_DEFAULT_IMAGE_URL || `${siteUrl}${siteConfig.ogImage}`;

  if (!isValidOgImagePath(image)) {
    return fallback;
  }

  const trimmed = image!.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      u.pathname = u.pathname
        .split('/')
        .map((seg) => (seg ? encodeURIComponent(decodeURIComponent(seg)) : seg))
        .join('/');
      return u.toString();
    } catch {
      return encodeURI(trimmed);
    }
  }

  const base = getOgMediaBase();
  let path = trimmed;
  if (path.startsWith('/public/')) path = path.slice('/public/'.length);
  else if (path.startsWith('public/')) path = path.slice('public/'.length);
  if (path.startsWith('/')) path = path.slice(1);

  const encodedPath = path
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');

  return `${base}${encodedPath}`;
}

// ============================================================================
// 3. Dynamic Page Metadata Factory
// ============================================================================

export interface PageMetadataProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string | null;
  url?: string;
  type?: 'website' | 'article' | 'book' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  noIndex?: boolean;
}

/**
 * Generates unified Next.js Metadata with canonical URLs, Open Graph, Twitter cards,
 * and search engine bot directives.
 */
export function generatePageMetadata({
  title,
  description,
  keywords = [],
  image,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  authors = [],
  noIndex = false,
}: PageMetadataProps = {}): Metadata {
  const fullTitle =
    title && title.trim() && title.trim() !== siteConfig.name
      ? `${title.trim()} | ${siteConfig.name}`
      : title?.trim() || siteConfig.name;
  const fullDescription = description || siteConfig.description;
  const fullImage = resolveOgImageUrl(image);
  const fullUrl = url ? `${siteConfig.url}${url.startsWith('/') ? url : `/${url}`}` : siteConfig.url;
  const allKeywords = Array.from(new Set([...siteConfig.keywords, ...keywords]));

  const ogImageEntry = {
    url: fullImage,
    width: 1200,
    height: 630,
    alt: fullTitle,
  };

  const validOpenGraphTypes = ["website", "article", "book", "profile"] as const;
  const normalizedType = validOpenGraphTypes.includes(type as any) ? type : "website";

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: allKeywords,
    authors: authors.length > 0
      ? authors.map((author) => ({ name: author }))
      : [{ name: siteConfig.author }],
    creator: siteConfig.name,
    publisher: siteConfig.publisher,
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      type: normalizedType,
      locale: siteConfig.locale,
      url: fullUrl,
      title: fullTitle,
      description: fullDescription,
      siteName: siteConfig.name,
      images: [ogImageEntry],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: siteConfig.twitterCard,
      site: siteConfig.twitterSite,
      creator: siteConfig.twitterCreator,
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
    },
    alternates: {
      canonical: fullUrl,
    },
    category: siteConfig.category,
  };
}

// ============================================================================
// 4. Schema.org / JSON-LD Structured Data Layer
// ============================================================================

export function generateStructuredData({
  type = "Organization",
  data = {},
}: {
  type?: string;
  data?: Record<string, any>;
}): Record<string, any> {
  return {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };
}

/**
 * Organization structured data (VibeGrid brand, logo, social links)
 */
export function getOrganizationStructuredData() {
  return generateStructuredData({
    type: "Organization",
    data: {
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/icon-512.png`,
      description: siteConfig.description,
      foundingDate: siteConfig.founded,
      sameAs: [
        "https://github.com/manakhly/VibeGrid",
        "https://x.com/vibegrid"
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          email: "support@vibegrid.manakhly.tech",
          contactType: "customer service",
          availableLanguage: ["en"]
        }
      ]
    },
  });
}

/**
 * SocialMediaPosting / Article structured data for Vibe detail pages (/explore/[id])
 */
export function getPostStructuredData(post: {
  id: string;
  content?: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  image?: string | null;
  likesCount?: number;
  commentsCount?: number;
}) {
  if (!post || !post.id) return null;

  const headline = (post.content || "Vibe on VibeGrid").slice(0, 110);
  const postUrl = `${siteConfig.url}/explore/${post.id}`;
  const postImage = resolveOgImageUrl(post.image || post.authorAvatar);

  return generateStructuredData({
    type: "SocialMediaPosting",
    data: {
      headline,
      articleBody: post.content || "",
      url: postUrl,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": postUrl,
      },
      datePublished: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
      dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      author: {
        "@type": "Person",
        name: post.authorName || post.authorUsername || "Developer",
        url: post.authorUsername ? `${siteConfig.url}/profile/${post.authorUsername}` : siteConfig.url,
        ...(post.authorAvatar && { image: resolveOgImageUrl(post.authorAvatar) }),
      },
      publisher: {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          url: `${siteConfig.url}/icon-512.png`,
        },
      },
      image: postImage,
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: post.likesCount || 0,
        },
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/CommentAction",
          userInteractionCount: post.commentsCount || 0,
        },
      ],
    },
  });
}

/**
 * Community / Guild structured data for (/communities/[slug])
 */
export function getCommunityStructuredData(community: {
  name: string;
  slug: string;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  memberCount?: number;
  createdAt?: string | Date;
}) {
  if (!community || !community.slug) return null;

  const commUrl = `${siteConfig.url}/communities/${community.slug}`;
  const image = resolveOgImageUrl(community.bannerUrl || community.avatarUrl);

  return generateStructuredData({
    type: "Community",
    data: {
      name: community.name,
      description: community.description || `${community.name} Guild on VibeGrid`,
      url: commUrl,
      image,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": commUrl,
      },
      ...(community.createdAt && {
        dateCreated: new Date(community.createdAt).toISOString(),
      }),
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/JoinAction",
        userInteractionCount: community.memberCount || 0,
      },
    },
  });
}

/**
 * Developer Profile structured data for (/profile/[username])
 */
export function getProfileStructuredData(profile: {
  username: string;
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  website?: string | null;
}) {
  if (!profile || !profile.username) return null;

  const profileUrl = `${siteConfig.url}/profile/${profile.username}`;
  const sameAs = [profile.githubUrl, profile.website].filter(Boolean) as string[];

  return generateStructuredData({
    type: "ProfilePage",
    data: {
      name: profile.name || profile.username,
      url: profileUrl,
      mainEntity: {
        "@type": "Person",
        name: profile.name || profile.username,
        alternateName: `@${profile.username}`,
        description: profile.bio || "Developer on VibeGrid",
        image: resolveOgImageUrl(profile.avatarUrl),
        url: profileUrl,
        ...(sameAs.length > 0 && { sameAs }),
      },
    },
  });
}

/**
 * BreadcrumbList structured data for rich SERP navigation
 */
export function getBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>
) {
  if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) return null;

  return generateStructuredData({
    type: "BreadcrumbList",
    data: {
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.url.startsWith('http') ? crumb.url : `${siteConfig.url}${crumb.url.startsWith('/') ? crumb.url : `/${crumb.url}`}`,
      })),
    },
  });
}
