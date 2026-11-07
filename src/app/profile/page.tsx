import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/server';
import { getProfileUseCase } from '@/shared/infrastructure/di-container';

export default async function ProfileIndexPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const session = await getCurrentSession();
  
  if (!session.isAuthenticated || !session.user) {
    redirect('/login?callbackUrl=/profile');
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const queryParts: string[] = [];
  if (resolvedParams) {
    for (const [key, val] of Object.entries(resolvedParams)) {
      if (typeof val === 'string') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      } else if (Array.isArray(val)) {
        val.forEach((v) => queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
      }
    }
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  const dbUser: any = await getProfileUseCase.execute(session.user.username || session.user.id).catch(() => null);

  const username = dbUser?.username || session.user.name || session.user.email.split('@')[0];
  redirect(`/profile/${encodeURIComponent(username)}${queryString}`);
}
