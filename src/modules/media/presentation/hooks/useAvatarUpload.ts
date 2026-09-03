'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export function useAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Unsupported file type. Please select JPEG, PNG, or WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds max limit of 10MB.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setIsUploading(true);
    try {
      const { requestAvatarUploadIntentAction, confirmAvatarUploadAction } = await import('@/actions/media.action');

      // 1. Request Upload Intent
      const intentRes = await requestAvatarUploadIntentAction({
        mimeType: selectedFile.type,
        fileSizeBytes: selectedFile.size,
      });

      if (!intentRes.success || !intentRes.data) {
        toast.error(intentRes.error || 'Failed to create upload intent');
        return null;
      }

      const { assetId, uploadUrl } = intentRes.data;

      // 2. Upload file directly to MinIO presigned PUT URL
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!putRes.ok) {
        toast.error('Failed to upload image file to storage');
        return null;
      }

      // 3. Confirm Upload with Media Microservice
      const confirmRes = await confirmAvatarUploadAction(assetId);
      if (!confirmRes.success || !confirmRes.data) {
        toast.error(confirmRes.error || 'Failed to confirm avatar upload');
        return null;
      }

      return assetId;
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during avatar upload');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    selectedFile,
    previewUrl,
    setPreviewUrl,
    handleFileSelect,
    uploadAvatar,
  };
}
