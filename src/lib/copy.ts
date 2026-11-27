import commonData from '@/data/common.json';
import feedData from '@/data/feed.json';
import profileData from '@/data/profile.json';
import communitiesData from '@/data/communities.json';
import messagesData from '@/data/messages.json';
import notificationsData from '@/data/notifications.json';
import authData from '@/data/auth.json';

export type SupportedLanguage = 'en' | 'ar';

const dictionaries: Record<string, Record<string, any>> = {
  common: commonData,
  feed: feedData,
  profile: profileData,
  communities: communitiesData,
  messages: messagesData,
  notifications: notificationsData,
  auth: authData,
};

/**
 * Accessor reading from domain/page-level dictionaries under src/data/.
 * Supports both domain-prefixed keys (e.g. 'common.actions.follow', 'feed.createPost.placeholder')
 * and legacy flat keys for backward compatibility.
 * Default language is 'en', with full support for future locale switching ('ar').
 */
export function t(key: string, fallback?: string, lang: SupportedLanguage = 'en'): string {
  if (!key) return fallback || '';

  const parts = key.split('.');
  const domain = parts[0];

  // 1. Direct domain match (e.g., 'common.actions.follow' -> dictionary['common'][lang]['actions']['follow'])
  if (domain in dictionaries) {
    const subParts = parts.slice(1);
    let current: any = dictionaries[domain][lang] || dictionaries[domain]['en'];

    for (const part of subParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = null;
        break;
      }
    }

    if (typeof current === 'string') {
      return current;
    }
  }

  // 2. Fallback search across all domains for legacy un-prefixed keys
  for (const dictName of Object.keys(dictionaries)) {
    const root = dictionaries[dictName][lang] || dictionaries[dictName]['en'];
    let current: any = root;
    let found = true;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        found = false;
        break;
      }
    }

    if (found && typeof current === 'string') {
      return current;
    }
  }

  return fallback || key;
}

export const copy = {
  common: commonData,
  feed: feedData,
  profile: profileData,
  communities: communitiesData,
  messages: messagesData,
  notifications: notificationsData,
  auth: authData,
};
