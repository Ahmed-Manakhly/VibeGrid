export type DeveloperLinkType = 'github' | 'linkedin' | 'website' | 'twitter' | 'portfolio' | 'other';

export interface DeveloperLink {
  type: DeveloperLinkType;
  url: string;
  label?: string;
}

export class DeveloperLinksValueObject {
  private static DANGEROUS_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:'];

  public static sanitizeUrl(rawUrl: string): string | null {
    if (!rawUrl || typeof rawUrl !== 'string') return null;

    const trimmed = rawUrl.trim();
    if (!trimmed) return null;

    const lower = trimmed.toLowerCase();
    for (const scheme of this.DANGEROUS_SCHEMES) {
      if (lower.startsWith(scheme)) {
        return null;
      }
    }

    let formattedUrl = trimmed;
    if (!/^https?:\/\//i.test(trimmed)) {
      formattedUrl = `https://${trimmed}`;
    }

    try {
      const parsed = new URL(formattedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  public static parse(linksData: any): DeveloperLink[] {
    if (!linksData) return [];

    let arrayData: any[] = [];
    if (typeof linksData === 'string') {
      try {
        arrayData = JSON.parse(linksData);
      } catch {
        return [];
      }
    } else if (Array.isArray(linksData)) {
      arrayData = linksData;
    }

    if (!Array.isArray(arrayData)) return [];

    const result: DeveloperLink[] = [];
    const seenUrls = new Set<string>();

    for (const item of arrayData) {
      if (!item || typeof item !== 'object') continue;
      
      const rawUrl = item.url;
      const validUrl = this.sanitizeUrl(rawUrl);
      if (!validUrl) continue;

      const normalizedUrlKey = validUrl.toLowerCase().replace(/\/$/, '');
      if (seenUrls.has(normalizedUrlKey)) continue;

      seenUrls.add(normalizedUrlKey);
      
      let type: DeveloperLinkType = 'other';
      if (item.type && ['github', 'linkedin', 'website', 'twitter', 'portfolio'].includes(item.type)) {
        type = item.type as DeveloperLinkType;
      } else {
        // Auto-detect type from URL
        const lowerUrl = validUrl.toLowerCase();
        if (lowerUrl.includes('github.com')) type = 'github';
        else if (lowerUrl.includes('linkedin.com')) type = 'linkedin';
        else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) type = 'twitter';
        else type = item.type === 'other' ? 'other' : 'website';
      }

      result.push({
        type,
        url: validUrl,
        label: item.label ? String(item.label).slice(0, 30) : undefined,
      });
    }

    return result;
  }

  public static format(links: DeveloperLink[]): DeveloperLink[] {
    return this.parse(links);
  }
}
