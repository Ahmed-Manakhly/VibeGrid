'use server';

import { createMediaUploadIntent, confirmMediaUpload } from '@/lib/media/server-media.client';

export async function requestAvatarUploadIntentAction(params: {
  mimeType: string;
  fileSizeBytes: number;
}) {
  return await createMediaUploadIntent({
    mimeType: params.mimeType,
    fileSizeBytes: params.fileSizeBytes,
    purpose: 'avatar',
  });
}

export async function confirmAvatarUploadAction(assetId: string) {
  return await confirmMediaUpload(assetId);
}
