const urlRelative = (
  url: string | null | undefined,
  imgOrigin?: string,
  holder: string | null = null,
  serverFiles: string[] = ['avatars', 'posts', 'vibes', 'uploads', 'products', 'contents', 'users', 'campaigns'],
  isEmail: boolean = false,
  isPage: boolean = false
): string | null => {
  function isAbsoluteUrl(u: string): boolean {
    return /^https?:\/\//.test(u);
  }

  if (!url || typeof url !== 'string') {
    return holder;
  }

  if (serverFiles.some(item => url?.startsWith(item))) {
    return encodeURI((imgOrigin || '') + url);
  } else if (isAbsoluteUrl(url)) {
    return encodeURI(url);
  } else if (isEmail) {
    return `mailto:${url}`;
  } else if (isPage) {
    return `${url}`;
  } else {
    return holder;
  }
};

export default urlRelative;
