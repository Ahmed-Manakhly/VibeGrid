import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';

const isProduction = EnvConfigRepository.isProduction();
const { accessTokenMaxAge, refreshTokenMaxAge } = EnvConfigRepository.getCookieConfig();

export const COOKIE_CONFIG = {
  accessToken: {
    name: 'access_token',
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: accessTokenMaxAge,
    },
  },
  refreshToken: {
    name: 'refresh_token',
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: refreshTokenMaxAge,
    },
  },
};

