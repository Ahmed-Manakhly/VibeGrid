/**
 * Internal Media Microservice Client for VibeGrid Frontend
 */

export interface UploadMediaOptions {
  file: File;
  purpose: 'avatar' | 'post_attachment';
}

export interface UploadMediaResult {
  assetId: string;
  publicUrl: string;
  mimeType: string;
}

const MEDIA_SERVICE_URL = process.env.NEXT_PUBLIC_MEDIA_API_URL || 'http://localhost:3002';

export async function uploadMediaAsset({ file, purpose }: UploadMediaOptions): Promise<UploadMediaResult> {
  // Step 1: Request Upload Intent
  const intentRes = await fetch(`${MEDIA_SERVICE_URL}/api/media/upload-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      purpose,
    }),
  });

  if (!intentRes.ok) {
    const errorData = await intentRes.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to initiate upload intent');
  }

  const intentData = await intentRes.json();
  const assetId = intentData.data?.assetId || intentData.assetId;
  const uploadUrl = intentData.data?.uploadUrl || intentData.uploadUrl;

  // Step 2: Directly upload binary content to pre-signed URL (MinIO)
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error('Failed to upload file to storage server');
  }

  // Step 3: Confirm Upload with Media Service
  const confirmRes = await fetch(`${MEDIA_SERVICE_URL}/api/media/confirm-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ assetId }),
  });

  if (!confirmRes.ok) {
    const errorData = await confirmRes.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to confirm upload');
  }

  const confirmData = await confirmRes.json();
  const publicUrl = confirmData.data?.publicUrl || confirmData.publicUrl;

  return {
    assetId,
    publicUrl,
    mimeType: file.type,
  };
}

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const cleanUrl = url.toLowerCase();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.includes('video/mp4') ||
    cleanUrl.includes('video/webm')
  );
}
