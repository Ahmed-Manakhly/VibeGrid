const urlRelative = (
  url: string | null | undefined,
  imgOrigin?: string,
  holder: string | null = null,
  serverFiles: string[] = ['avatars', 'posts', 'vibes', 'uploads', 'products', 'contents', 'users', 'campaigns', 'api/media', 'media', 'vibegrid-media'],
  isEmail: boolean = false,
  isPage: boolean = false
): string | null => {
  function isAbsoluteUrl(u: string): boolean {
    return /^https?:\/\//.test(u);
  }

  if (!url || typeof url !== 'string' || !url.trim()) {
    return holder;
  }

  const trimmed = url.trim();

  // If the URL is already absolute and imgOrigin is explicitly passed,
  // ensure media storage endpoints (MinIO/localhost/bucket) align with the target imgOrigin
  if (imgOrigin && isAbsoluteUrl(trimmed)) {
    for (const prefix of serverFiles) {
      const idx = trimmed.indexOf(`/${prefix}/`);
      if (idx !== -1) {
        const pathPart = trimmed.substring(idx + 1);
        const origin = imgOrigin.endsWith('/') ? imgOrigin : `${imgOrigin}/`;
        return encodeURI(`${origin}${pathPart.startsWith('/') ? pathPart.slice(1) : pathPart}`);
      }
    }
  }

  if (isAbsoluteUrl(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return encodeURI(trimmed);
  }

  const cleanUrl = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

  if (serverFiles.some(item => cleanUrl.startsWith(item))) {
    const origin = imgOrigin ? (imgOrigin.endsWith('/') ? imgOrigin : `${imgOrigin}/`) : '';
    return encodeURI(`${origin}${cleanUrl}`);
  } else if (trimmed.startsWith('/')) {
    return encodeURI(trimmed);
  } else if (isEmail) {
    return `mailto:${trimmed}`;
  } else if (isPage) {
    return trimmed;
  } else {
    return holder;
  }
};

export default urlRelative;
