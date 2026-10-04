import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';

export interface AuthJwtPayload {
  sub: string;
  userId: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  type: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export async function verifyAccessTokenRS256(token: string): Promise<AuthJwtPayload | null> {
  try {
    const formattedPublicKey = EnvConfigRepository.getJwtPublicKey();
    if (!formattedPublicKey) {
      return null;
    }
    const { importSPKI, jwtVerify } = await import('jose');
    const publicKey = await importSPKI(formattedPublicKey, 'RS256');
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
    });

    return {
      sub: payload.sub as string,
      userId: (payload.userId || payload.sub) as string,
      email: payload.email as string,
      role: (payload.role as string) || 'USER',
      isEmailVerified: Boolean(payload.isEmailVerified ?? payload.email_verified ?? false),
      type: (payload.type as string) || 'access',
      iat: payload.iat,
      exp: payload.exp,
      jti: payload.jti as string | undefined,
    };
  } catch (error) {
    return null;
  }
}
