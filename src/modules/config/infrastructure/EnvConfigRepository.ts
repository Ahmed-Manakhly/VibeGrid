/**
 * Single Source of Truth Config Repository for Environment Endpoints (DDD/CA Infrastructure Layer)
 *
 * Automatically resolves API Base URL, Media SSR origin, and Media CSR origin
 * directly from process.env based on NODE_ENV (development | docker_development | production)
 * without hardcoded fallback URL strings.
 */

export interface AppEndpoints {
  apiBaseUrl: string;
  imgOriginSsr: string;
  imgOriginCsr: string;
  imgOrigin: string; // Dynamically returns imgOriginSsr on server, imgOriginCsr on client
}

export class EnvConfigRepository {
  public static getEndpoints(): AppEndpoints {
    const isServer = typeof window === 'undefined';
    const envMode: string = process.env.NODE_ENV || 'development';

    let apiBaseUrl: string;
    let imgOriginSsr: string;
    let imgOriginCsr: string;

    if (envMode === 'docker_development') {
      apiBaseUrl = process.env.BASE_API_URL_DOCKER_DEV || '';
      imgOriginSsr = process.env.IMG_BASE_SSR_DOCKER_DEV || '';
      imgOriginCsr = process.env.IMG_BASE_CSR_DOCKER_DEV || '';
    } else if (envMode === 'production') {
      apiBaseUrl = process.env.BASE_API_URL_PROD || '';
      imgOriginSsr = process.env.IMG_BASE_SSR_PROD || '';
      imgOriginCsr = process.env.IMG_BASE_CSR_PROD || '';
    } else {
      // Default: Host native dev (NODE_ENV = development)
      apiBaseUrl = process.env.BASE_API_URL_DEV || '';
      imgOriginSsr = process.env.IMG_BASE_SSR_DEV || '';
      imgOriginCsr = process.env.IMG_BASE_CSR_DEV || '';
    }

    const cleanSsr = imgOriginSsr ? (imgOriginSsr.endsWith('/') ? imgOriginSsr : `${imgOriginSsr}/`) : '';
    const cleanCsr = imgOriginCsr ? (imgOriginCsr.endsWith('/') ? imgOriginCsr : `${imgOriginCsr}/`) : '';
    const imgOrigin = isServer ? cleanSsr : cleanCsr;

    return {
      apiBaseUrl,
      imgOriginSsr: cleanSsr,
      imgOriginCsr: cleanCsr,
      imgOrigin,
    };
  }

  public static getRedisUrl(): string {
    const rawUrl = process.env.REDIS_URL || '';
    if (!rawUrl) {
      return '';
    }

    try {
      if (rawUrl.includes('@') && rawUrl.startsWith('redis://')) {
        const parts = rawUrl.replace('redis://', '').split('@');
        const creds = parts[0].split(':');
        if (creds.length === 2) {
          const user = creds[0] ? encodeURIComponent(decodeURIComponent(creds[0])) : '';
          const pass = creds[1] ? encodeURIComponent(decodeURIComponent(creds[1])) : '';
          return `redis://${user}:${pass}@${parts[1]}`;
        }
      }
    } catch (e) {
      // Return raw URL if parsing fails
    }

    return rawUrl;
  }
}
