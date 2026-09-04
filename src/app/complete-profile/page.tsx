import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/server';
import { prisma } from '@/shared/infrastructure/prisma';
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

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, username: true, bio: true, image: true },
  });

  const isComplete = Boolean(
    dbUser &&
      dbUser.username &&
      dbUser.username.trim() !== '' &&
      !dbUser.username.startsWith('user_') &&
      dbUser.name &&
      dbUser.name.trim() !== ''
  );

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
