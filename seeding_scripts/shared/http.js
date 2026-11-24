/**
 * Shared Seeding HTTP Helper
 * ============================================================
 * Provides robust HTTP client functionality for standalone seeding scripts:
 * - GET, POST, PUT, PATCH, DELETE
 * - Cookie management / Cookie jar
 * - Transient error retries (408, 429, 500, 502, 503, 504)
 * - Timeout handling
 * - Loud failure reporting
 * ============================================================
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

class HttpClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.cookies = new Map();
  }

  /**
   * Format cookie map into Cookie header string
   */
  getCookieHeader() {
    const pairs = [];
    for (const [name, value] of this.cookies.entries()) {
      pairs.push(`${name}=${value}`);
    }
    return pairs.join('; ');
  }

  /**
   * Parse Set-Cookie header and store in cookie map
   */
  parseSetCookies(responseHeaders) {
    const rawCookies = responseHeaders.getSetCookie 
      ? responseHeaders.getSetCookie() 
      : [responseHeaders.get('set-cookie') || ''];
      
    for (const header of rawCookies) {
      if (!header) continue;
      const parts = header.split(';')[0].split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (name && value) {
          this.cookies.set(name, value);
        }
      }
    }
  }

  /**
   * Execute HTTP Request with retry and timeout policy
   */
  async request(method, path, options = {}) {
    const {
      body = null,
      headers = {},
      authBearer = null,
      timeoutMs = 30000,
      maxRetries = 5,
      retryDelayMs = 500,
    } = options;

    const url = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const cookieStr = this.getCookieHeader();
    if (cookieStr) {
      requestHeaders['Cookie'] = cookieStr;
    }

    if (authBearer) {
      requestHeaders['Authorization'] = `Bearer ${authBearer}`;
    }

    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const init = {
          method,
          headers: requestHeaders,
          signal: controller.signal,
        };

        if (body !== null && method !== 'GET' && method !== 'HEAD') {
          init.body = typeof body === 'string' || body instanceof Buffer || body instanceof Uint8Array
            ? body
            : JSON.stringify(body);
        }

        const res = await fetch(url, init);
        clearTimeout(timeoutId);

        this.parseSetCookies(res.headers);

        const contentType = res.headers.get('content-type') || '';
        let data = null;
        let rawBody = '';

        if (contentType.includes('application/json')) {
          try {
            data = await res.json();
          } catch {
            data = null;
          }
        } else {
          rawBody = await res.text();
        }

        const result = {
          status: res.status,
          ok: res.ok,
          headers: res.headers,
          data,
          rawBody,
          cookies: new Map(this.cookies),
        };

        if (!res.ok && TRANSIENT_STATUS_CODES.has(res.status) && attempt < maxRetries) {
          console.warn(`⚠️ [HTTP ${method} ${url}] Transient error ${res.status}. Retrying (${attempt}/${maxRetries - 1}) in ${retryDelayMs}ms...`);
          await sleep(retryDelayMs * attempt);
          continue;
        }

        return result;

      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;
        const isAbort = err.name === 'AbortError';

        if ((isAbort || err.message.includes('fetch failed')) && attempt < maxRetries) {
          console.warn(`⚠️ [HTTP ${method} ${url}] Network/Timeout error (${err.message}). Retrying (${attempt}/${maxRetries - 1}) in ${retryDelayMs}ms...`);
          await sleep(retryDelayMs * attempt);
          continue;
        }

        throw new Error(`[HTTP FAIL] ${method} ${url} failed: ${err.message}`);
      }
    }

    throw new Error(`[HTTP FAIL] ${method} ${url} failed after ${maxRetries - 1} retries: ${lastError?.message || 'Unknown error'}`);
  }

  get(path, options = {}) {
    return this.request('GET', path, options);
  }

  post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body });
  }

  put(path, body, options = {}) {
    return this.request('PUT', path, { ...options, body });
  }

  patch(path, body, options = {}) {
    return this.request('PATCH', path, { ...options, body });
  }

  del(path, options = {}) {
    return this.request('DELETE', path, options);
  }
}

module.exports = { HttpClient };
