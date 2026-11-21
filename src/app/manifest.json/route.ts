import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';
export const revalidate = 86400;

export async function GET() {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, 'utf-8');
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/manifest+json; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        },
      });
    }

    // Fallback if file on disk is unavailable
    const fallbackManifest = {
      id: "/",
      name: "VibeGrid - Developer Pulse & Real-Time Tech Newsfeed",
      short_name: "VibeGrid",
      description: "Real-time Tech Newsfeed / Developer Pulse. Drop a Vibe, tune in to developer discussions, join tech guilds, and share code snippets.",
      start_url: "/",
      display: "standalone",
      background_color: "#0a0f0d",
      theme_color: "#10b981",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    };

    return NextResponse.json(fallbackManifest, {
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

