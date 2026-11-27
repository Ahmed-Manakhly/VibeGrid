import copyDictionary from '@/content/copy.json';

type CopyDictionary = typeof copyDictionary;

/**
 * Type-safe dot-notation copy reader.
 * Works seamlessly in both Server Components and Client Components.
 * Example: t('home.title') => "Your feed"
 */
export function t(key: string, fallback?: string): string {
  if (!key) return fallback || '';

  const parts = key.split('.');
  let current: any = copyDictionary;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return fallback || key;
    }
  }

  return typeof current === 'string' ? current : fallback || key;
}

export const copy = copyDictionary;
