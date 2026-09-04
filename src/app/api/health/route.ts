import { NextResponse } from 'next/server';
import { cacheService } from '@/shared/infrastructure/di-container';

export const dynamic = "force-dynamic";

export async function GET() {
  const uptime = process.uptime();
  let redisStatus = 'unknown';

  try {
    const isAlive = typeof cacheService.ping === 'function' ? await cacheService.ping() : true;
    redisStatus = isAlive ? 'healthy' : 'degraded';
  } catch {
    redisStatus = 'unreachable';
  }

  const overallStatus = redisStatus === 'healthy' ? 'healthy' : 'degraded';

  return NextResponse.json(
    {
      status: overallStatus,
      service: 'vibegrid-bff',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      checks: {
        redis: redisStatus,
      },
    },
    { status: overallStatus === 'healthy' ? 200 : 503 }
  );
}
