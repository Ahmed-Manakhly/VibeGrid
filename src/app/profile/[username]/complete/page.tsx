import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/server';
import { getProfileUseCase } from '@/shared/infrastructure/di-container';
import { notFound } from 'next/navigation';
import { CompleteProfileClient } from '@/app/complete-profile/CompleteProfileClient';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> | { username: string } }) {
  const resolvedParams = await params;
  return {
    title: `Complete Profile (@${resolvedParams.username}) | VibeGrid`,
  };
}

export default async function ProfileCompleteSubRoutePage({ params }: { params: Promise<{ username: string }> | { username: string } }) {
  const resolvedParams = await params;
  const session = await getCurrentSession();

  if (!session.isAuthenticated || !session.user) {
    redirect(`/login?callbackUrl=/profile/${encodeURIComponent(resolvedParams.username)}/complete`);
  }

  const dbUser: any = await getProfileUseCase.execute(resolvedParams.username).catch(() => null);

  if (!dbUser) {
    notFound();
  }

  // Security & Authorization Guard: Only the profile owner can complete/edit their profile
  if (session.user.id !== dbUser.id) {
    redirect(`/profile/${resolvedParams.username}`);
  }

  return (
    <CompleteProfileClient
      user={{
        id: dbUser.id,
        email: dbUser.email || session.user.email,
        name: dbUser.name || null,
        username: dbUser.username || '',
        bio: dbUser.bio || null,
        image: dbUser.image || null,
      }}
    />
  );
}
