import { RegisterForm } from '@/modules/auth/presentation/components/RegisterForm';
import { AuthLayoutWrapper } from '@/components/auth/AuthLayoutWrapper';

export const metadata = {
  title: 'Create Account | VibeGrid',
  description: 'Join VibeGrid to create, connect, and share signals with your community.',
};

interface RegisterPageProps {
  searchParams: Promise<{ email?: string; verify?: string }> | { email?: string; verify?: string };
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialEmail = resolvedSearchParams?.email || '';
  const initialVerify = resolvedSearchParams?.verify === 'true';

  return (
    <AuthLayoutWrapper
      title="Join the Signal."
      subtitle="Set up your profile to start creating, connecting, and sharing on VibeGrid."
      badge="CLAIM YOUR HANDLE"
    >
      <RegisterForm initialEmail={initialEmail} initialVerify={initialVerify} />
    </AuthLayoutWrapper>
  );
}
