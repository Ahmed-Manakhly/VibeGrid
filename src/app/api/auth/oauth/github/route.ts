import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authGatewayUrl = process.env.INTERNAL_API_GATEWAY_URL || 'http://localhost:8000';
  const targetUrl = `${authGatewayUrl}/api/auth/oauth/github`;
  return NextResponse.redirect(targetUrl);
}
