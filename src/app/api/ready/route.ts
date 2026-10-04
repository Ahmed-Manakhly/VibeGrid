import { NextResponse } from 'next/server';
import { cacheService } from '@/shared/infrastructure/di-container';
import { prisma } from '@/shared/infrastructure/prisma';

export const dynamic = "force-dynamic";

export async function GET() {
  let redisStatus = 'unknown';
  let dbStatus = 'unknown';

  try {
    const isCacheAlive = typeof cacheService.ping === 'function' ? await cacheService.ping() : true;
    redisStatus = isCacheAlive ? 'healthy' : 'degraded';
  } catch {
    redisStatus = 'unreachable';
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'healthy';
  } catch {
    dbStatus = 'unreachable';
  }

  const isReady = redisStatus === 'healthy' && dbStatus === 'healthy';

  return NextResponse.json(
    {
      ready: isReady,
      service: 'vibegrid-bff',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        cache: redisStatus,
      },
    },
    { status: isReady ? 200 : 503 }
  );
}
