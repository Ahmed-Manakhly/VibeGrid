import { headers } from 'next/headers';

export async function getCorrelationHeaders(): Promise<Record<string, string>> {
  try {
    const headerStore = await headers();
    const requestId = headerStore.get('x-request-id');
    if (requestId) {
      return { 'X-Request-ID': requestId };
    }
  } catch (err) {
    // Outside Next.js request lifecycle fallback
  }
  return {};
}
