import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl || !targetUrl.startsWith('http')) {
      return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VibeGridBot/1.0; +https://vibegrid.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch URL' }, { status: 422 });
    }

    const html = await response.text();

    // Extract OpenGraph / Meta tags with basic regex to avoid heavy parser dependencies
    const getMetaTag = (property: string) => {
      const match =
        html.match(new RegExp(`<meta[^>]*property=["'](?:og:)?${property}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*name=["'](?:og:)?${property}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["'](?:og:)?${property}["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["'](?:og:)?${property}["']`, 'i'));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = getMetaTag('title') || (titleMatch ? titleMatch[1].trim() : null);
    const description = getMetaTag('description');
    const image = getMetaTag('image');
    const siteName = getMetaTag('site_name');

    if (!title && !description && !image) {
      return NextResponse.json({ success: false, error: 'No metadata found' });
    }

    let absoluteImage = image;
    if (image && !image.startsWith('http')) {
      try {
        const parsedBase = new URL(targetUrl);
        absoluteImage = new URL(image, parsedBase.origin).toString();
      } catch {
        absoluteImage = null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        url: targetUrl,
        title: title ? title.slice(0, 150) : null,
        description: description ? description.slice(0, 250) : null,
        image: absoluteImage,
        siteName: siteName || new URL(targetUrl).hostname.replace('www.', ''),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not resolve preview' }, { status: 500 });
  }
}

