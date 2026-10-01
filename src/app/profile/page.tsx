import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/server';
import { getProfileUseCase } from '@/shared/infrastructure/di-container';

export default async function ProfileIndexPage() {
  const session = await getCurrentSession();
  
  if (!session.isAuthenticated || !session.user) {
    redirect('/login?callbackUrl=/profile');
  }

  const dbUser: any = await getProfileUseCase.execute(session.user.username || session.user.id).catch(() => null);

  const username = dbUser?.username || session.user.name || session.user.email.split('@')[0];
  redirect(`/profile/${encodeURIComponent(username)}`);
}
