export type NavMatch =
  | { type: 'exact' }
  | { type: 'segment-prefix'; base?: string };

export interface NavItem {
  label: string;
  href: string;
  match?: NavMatch;
}

export function isRouteActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  const match = item.match ?? (item.href === '/' ? { type: 'exact' } : { type: 'segment-prefix' });

  if (match.type === 'exact') {
    return pathname === item.href;
  }

  const base = match.base ?? item.href;
  return pathname === base || pathname.startsWith(`${base}/`);
}
