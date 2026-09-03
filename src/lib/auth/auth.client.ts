const GATEWAY_BASE_URL = process.env.INTERNAL_API_GATEWAY_URL || process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8000';

export async function authServiceFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; headers?: Headers; data: T }> {
  const url = `${GATEWAY_BASE_URL.replace(/\/$/, '')}/api/auth${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
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
      console.log(`[AuthServiceFetch Error] ${options.method || 'GET'} ${url} -> Status: ${res.status}`, data);
    }

    return {
      ok: res.ok,
      status: res.status,
      headers: res.headers,
      data,
    };
  } catch (err: any) {
    console.error(`[AuthServiceFetch Exception] ${options.method || 'GET'} ${url}`, err);
    return {
      ok: false,
      status: 500,
      data: { success: false, message: err?.message || 'Network request to Auth Service failed' } as any,
    };
  }
}
