import { NextResponse } from 'next/server';

export const dynamic = 'force-static';
export const revalidate = 86400;

const CANONICAL_MANIFEST = {
  id: "/",
  name: "VibeGrid - Developer Pulse & Real-Time Tech Newsfeed",
  short_name: "VibeGrid",
  description:
    "Real-time Tech Newsfeed / Developer Pulse. Drop a Vibe, tune in to developer discussions, join tech guilds, and share code snippets.",
  start_url: "/",
  display: "standalone",
  background_color: "#0a0f0d",
  theme_color: "#10b981",
  orientation: "portrait-primary",
  dir: "auto",
  icons: [
    {
      src: "/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable",
    },
    {
      src: "/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
  ],
  shortcuts: [
    {
      name: "Explore Vibes",
      short_name: "Explore",
      description: "Discover trending tech vibes and developer discussions",
      url: "/explore",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
        },
      ],
    },
    {
      name: "Developer Communities",
      short_name: "Communities",
      description: "Join tech guilds and developer communities",
      url: "/communities",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
        },
      ],
    },
  ],
  categories: ["technology", "social", "developer", "productivity"],
  lang: "en",
};

export async function GET() {
  return NextResponse.json(CANONICAL_MANIFEST, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}

