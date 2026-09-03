import 'server-only';
import { cookies } from 'next/headers';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';

const getGatewayUrl = () => process.env.INTERNAL_API_GATEWAY_URL || 'http://localhost:8000';

export async function createMediaUploadIntent(params: {
  mimeType: string;
  fileSizeBytes: number;
  purpose: 'avatar' | 'post_attachment';
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_CONFIG.accessToken.name)?.value;

  if (!token) {
    return { success: false, error: 'Authentication required' };
  }

  try {
    const res = await fetch(`${getGatewayUrl()}/api/media/upload-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
      cache: 'no-store',
    });

    const json = await res.json();
    if (!res.ok || json.status !== 'success') {
      return { success: false, error: json.message || 'Failed to create upload intent' };
    }

    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error creating upload intent' };
  }
}

export async function confirmMediaUpload(assetId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_CONFIG.accessToken.name)?.value;

  if (!token) {
    return { success: false, error: 'Authentication required' };
  }

  try {
    const res = await fetch(`${getGatewayUrl()}/api/media/confirm-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ assetId }),
      cache: 'no-store',
    });

    const json = await res.json();
    if (!res.ok || json.status !== 'success') {
      return { success: false, error: json.message || 'Failed to confirm upload' };
    }

    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error confirming upload' };
  }
}

export async function fetchServerMediaAsset(assetId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_CONFIG.accessToken.name)?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${getGatewayUrl()}/api/media/assets/${assetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 'success') return null;
    return json.data;
  } catch (err) {
    return null;
  }
}
