import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/server';
import { getProfileUseCase } from '@/shared/infrastructure/di-container';
import { ProfileRules } from '@/modules/social/domain/ProfileRules';
import { CompleteProfileClient } from './CompleteProfileClient';

export const metadata = {
  title: 'Complete Profile | VibeGrid',
  description: 'Set your username and display name to get started on VibeGrid.',
};

export default async function CompleteProfilePage() {
  const session = await getCurrentSession();

  if (!session.isAuthenticated || !session.user) {
    redirect('/login?callbackUrl=/complete-profile');
  }

  const dbUser: any = await getProfileUseCase.execute(session.user.username || session.user.id).catch(() => null);

  const isComplete = ProfileRules.isProfileComplete(dbUser);

  if (isComplete) {
    redirect('/');
  }

  return (
    <CompleteProfileClient
      user={{
        id: session.user.id,
        email: session.user.email,
        name: dbUser?.name || null,
        username: dbUser?.username || '',
        bio: dbUser?.bio || null,
        image: dbUser?.image || null,
      }}
    />
  );
}
