import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';
import { getCorrelationHeaders } from '@/lib/request-context';
import { logger } from '@/shared/infrastructure/di-container';

export async function authServiceFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; headers?: Headers; data: T }> {
  const { apiBaseUrl } = EnvConfigRepository.getEndpoints();
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/auth${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const correlationHeaders = await getCorrelationHeaders();
  const headers = new Headers(options.headers || {});
  Object.entries(correlationHeaders).forEach(([k, v]) => {
    if (!headers.has(k)) headers.set(k, v);
  });

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    let data: any = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      logger.warn(`[AuthServiceFetch Error] ${options.method || 'GET'} ${url} -> Status: ${res.status}`, { data });
    }

    return {
      ok: res.ok,
      status: res.status,
      headers: res.headers,
      data,
    };
  } catch (err: any) {
    logger.error(`[AuthServiceFetch Exception] ${options.method || 'GET'} ${url}`, err);
    return {
      ok: false,
      status: 500,
      data: { success: false, message: err?.message || 'Network request to Auth Service failed' } as any,
    };
  }
}

