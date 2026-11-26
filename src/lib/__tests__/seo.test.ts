import {
  siteConfig,
  getOgMediaBase,
  isValidOgImagePath,
  resolveOgImageUrl,
  generatePageMetadata,
  getOrganizationStructuredData,
  getPostStructuredData,
  getCommunityStructuredData,
  getProfileStructuredData,
  getBreadcrumbStructuredData,
} from '../seo';

describe('VibeGrid SEO & Social Graph Engine', () => {
  describe('siteConfig', () => {
    it('should define core platform constants', () => {
      expect(siteConfig.name).toBe('VibeGrid');
      expect(siteConfig.url).toBeDefined();
      expect(siteConfig.description).toContain('Developer Pulse');
      expect(siteConfig.twitterCard).toBe('summary_large_image');
      expect(siteConfig.keywords.length).toBeGreaterThan(5);
    });
  });

  describe('isValidOgImagePath', () => {
    it('should return false for null, undefined, empty, or placeholder strings', () => {
      expect(isValidOgImagePath(null)).toBe(false);
      expect(isValidOgImagePath(undefined)).toBe(false);
      expect(isValidOgImagePath('')).toBe(false);
      expect(isValidOgImagePath('   ')).toBe(false);
      expect(isValidOgImagePath('null')).toBe(false);
      expect(isValidOgImagePath('undefined')).toBe(false);
      expect(isValidOgImagePath('https://cdn.example.com/imgHolder.png')).toBe(false);
    });

    it('should return true for valid image paths', () => {
      expect(isValidOgImagePath('/icon-512.png')).toBe(true);
      expect(isValidOgImagePath('public/banners/hero.jpg')).toBe(true);
      expect(isValidOgImagePath('https://vibegrid.manakhly.tech/logo.png')).toBe(true);
    });
  });

  describe('resolveOgImageUrl', () => {
    it('should fall back to site default when given an invalid image', () => {
      const fallback = resolveOgImageUrl(null);
      expect(fallback).toContain(siteConfig.ogImage);
      expect(fallback.startsWith('http')).toBe(true);
    });

    it('should preserve and encode valid absolute URLs', () => {
      const abs = 'https://vibegrid.manakhly.tech/uploads/my%20pic.png';
      expect(resolveOgImageUrl(abs)).toBe('https://vibegrid.manakhly.tech/uploads/my%20pic.png');
    });

    it('should convert relative paths to absolute HTTPS URLs', () => {
      const resolved = resolveOgImageUrl('/public/banners/tech.png');
      expect(resolved.startsWith('http')).toBe(true);
      expect(resolved).toContain('banners/tech.png');
      expect(resolved).not.toContain('/public/public/');
    });

    it('should prioritize IMG_BASE_CSR_PROD and fall back to IMG_BASE_SSR_PROD', () => {
      const prevCsr = process.env.IMG_BASE_CSR_PROD;
      const prevSsr = process.env.IMG_BASE_SSR_PROD;
      try {
        process.env.IMG_BASE_CSR_PROD = 'https://vibegrid.manakhly.tech/vibegrid-media';
        process.env.IMG_BASE_SSR_PROD = 'http://vibegrid_minio:9000/vibegrid-media/';
        expect(getOgMediaBase()).toBe('https://vibegrid.manakhly.tech/vibegrid-media/');
        expect(resolveOgImageUrl('avatars/dev.png')).toBe(
          'https://vibegrid.manakhly.tech/vibegrid-media/avatars/dev.png'
        );

        delete process.env.IMG_BASE_CSR_PROD;
        expect(getOgMediaBase()).toBe('http://vibegrid_minio:9000/vibegrid-media/');
      } finally {
        if (prevCsr === undefined) delete process.env.IMG_BASE_CSR_PROD;
        else process.env.IMG_BASE_CSR_PROD = prevCsr;
        if (prevSsr === undefined) delete process.env.IMG_BASE_SSR_PROD;
        else process.env.IMG_BASE_SSR_PROD = prevSsr;
      }
    });
  });

  describe('generatePageMetadata', () => {
    it('should produce standard Next.js metadata with defaults', () => {
      const meta = generatePageMetadata();
      expect(meta.title).toBe(siteConfig.name);
      expect(meta.description).toBe(siteConfig.description);
      expect(meta.openGraph?.title).toBe(siteConfig.name);
      expect((meta.twitter as any)?.card).toBe('summary_large_image');
      expect((meta.robots as any)?.index).toBe(true);
    });

    it('should append site name to custom title', () => {
      const meta = generatePageMetadata({
        title: 'Explore Tech Discussions',
        description: 'Custom description',
        url: '/explore',
      });
      expect(meta.title).toBe('Explore Tech Discussions | VibeGrid');
      expect(meta.description).toBe('Custom description');
      expect(meta.alternates?.canonical).toContain('/explore');
    });

    it('should set noindex and nofollow when noIndex is true', () => {
      const meta = generatePageMetadata({
        title: 'Private Settings',
        noIndex: true,
      });
      expect((meta.robots as any)?.index).toBe(false);
      expect((meta.robots as any)?.follow).toBe(false);
    });

    it('should include both 1200x630 and 1:1 512x512 WhatsApp OG image entries', () => {
      const meta = generatePageMetadata({ title: 'WhatsApp Preview Test' });
      const images = meta.openGraph?.images as Array<{
        url: string;
        width?: number;
        height?: number;
      }>;
      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBe(2);
      expect(images[0]).toMatchObject({ width: 1200, height: 630 });
      expect(images[1]).toMatchObject({
        width: 512,
        height: 512,
      });
      expect(images[1].url).toContain('/icon-512x512.png');
    });
  });

  describe('Structured Data (JSON-LD) Generators', () => {
    it('should generate valid Organization structured data', () => {
      const org = getOrganizationStructuredData();
      expect(org['@context']).toBe('https://schema.org');
      expect(org['@type']).toBe('Organization');
      expect(org.name).toBe('VibeGrid');
      expect(org.url).toBe(siteConfig.url);
    });

    it('should generate valid SocialMediaPosting structured data for vibes', () => {
      const post = {
        id: 'vibe_123',
        content: 'Building Next.js 14 apps with Clean Architecture and SEO',
        authorName: 'Alex Dev',
        authorUsername: 'alexdev',
        authorAvatar: '/avatars/alex.png',
        createdAt: new Date('2026-11-21T09:00:00Z'),
        likesCount: 15,
        commentsCount: 3,
      };

      const ld = getPostStructuredData(post);
      expect(ld).not.toBeNull();
      expect(ld?.['@type']).toBe('SocialMediaPosting');
      expect(ld?.headline).toBe(post.content);
      expect(ld?.url).toContain('/explore/vibe_123');
      expect(ld?.author?.name).toBe('Alex Dev');
      expect(ld?.interactionStatistic?.length).toBe(2);
    });

    it('should generate valid Community structured data for guilds', () => {
      const comm = {
        name: 'TypeScript Wizards',
        slug: 'typescript-wizards',
        description: 'A guild for advanced TS patterns and compilers.',
        memberCount: 42,
      };

      const ld = getCommunityStructuredData(comm);
      expect(ld).not.toBeNull();
      expect(ld?.['@type']).toBe('Organization');
      expect(ld?.name).toBe('TypeScript Wizards');
      expect(ld?.url).toContain('/communities/typescript-wizards');
    });

    it('should generate valid ProfilePage structured data for developer profiles', () => {
      const profile = {
        username: 'johndoe',
        name: 'John Doe',
        bio: 'Full-stack software architect',
        githubUrl: 'https://github.com/johndoe',
      };

      const ld = getProfileStructuredData(profile);
      expect(ld).not.toBeNull();
      expect(ld?.['@type']).toBe('ProfilePage');
      expect(ld?.mainEntity?.name).toBe('John Doe');
      expect(ld?.mainEntity?.alternateName).toBe('@johndoe');
      expect(ld?.mainEntity?.sameAs).toContain('https://github.com/johndoe');
    });

    it('should generate BreadcrumbList structured data', () => {
      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Explore', url: '/explore' },
        { name: 'Post', url: '/explore/123' },
      ];

      const ld = getBreadcrumbStructuredData(breadcrumbs);
      expect(ld).not.toBeNull();
      expect(ld?.['@type']).toBe('BreadcrumbList');
      expect(ld?.itemListElement?.length).toBe(3);
      expect(ld?.itemListElement[0].position).toBe(1);
      expect(ld?.itemListElement[0].name).toBe('Home');
    });
  });
});
