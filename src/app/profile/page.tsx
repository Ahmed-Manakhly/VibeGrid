import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/server';
import { prisma } from '@/shared/infrastructure/prisma';

export default async function ProfileIndexPage() {
  const session = await getCurrentSession();
  
  if (!session.isAuthenticated || !session.user) {
    redirect('/login?callbackUrl=/profile');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  const username = dbUser?.username || session.user.name || session.user.email.split('@')[0];
  redirect(`/profile/${encodeURIComponent(username)}`);
}
