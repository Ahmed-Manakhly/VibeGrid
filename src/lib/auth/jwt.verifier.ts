const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtbGtIE/yX82dLxmg6kXl
kmxCvSFzqcwi4ZH9R+a2UKd17hQ7weLDASrCPwJz9ZO3nkjTINvOAsTcHhxhfxpB
3RN+CC7OqoyENbVDUjdp233+z9SvahyueKpLgUVz67bE7C/U9qR94LO8RmDLNr53
CbcDfVNpm901FWnnuZkLZ27JqJlLzXFVjCSwQ579LUkd+3nQRaFg5GT1PbyU5HNq
9out2VRwaAaqJCYrRq+HJVlNV5s5JquVAi0m9Z7jh53o7EWV/O3e53sfFmfRqgIG
72lyEZHge7M+Obge05OWp9mglzdJJzcKevDvr1TTse+OVTvf5PjGGWlYR9npv0vY
8wIDAQAB
-----END PUBLIC KEY-----`;

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
    const { importSPKI, jwtVerify } = await import('jose');
    const publicKey = await importSPKI(process.env.JWT_PUBLIC_KEY || PUBLIC_KEY_PEM, 'RS256');
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
    });

    return {
      sub: payload.sub as string,
      userId: (payload.userId || payload.sub) as string,
      email: payload.email as string,
      role: (payload.role as string) || 'USER',
      isEmailVerified: true,
      type: (payload.type as string) || 'access',
      iat: payload.iat,
      exp: payload.exp,
      jti: payload.jti as string | undefined,
    };
  } catch (error) {
    return null;
  }
}
