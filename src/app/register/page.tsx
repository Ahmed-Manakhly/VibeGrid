import { RegisterForm } from '@/modules/auth/presentation/components/RegisterForm';
import { AuthLayoutWrapper } from '@/components/auth/AuthLayoutWrapper';
import { generatePageMetadata } from '@/lib/seo';
import { t } from '@/lib/copy';

export const metadata = generatePageMetadata({
  title: 'Create Developer Account',
  description: 'Join VibeGrid to create developer vibes, connect with tech guilds, and share signals with the developer community.',
  url: '/register',
});

interface RegisterPageProps {
  searchParams: Promise<{ email?: string; verify?: string }> | { email?: string; verify?: string };
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialEmail = resolvedSearchParams?.email || '';
  const initialVerify = resolvedSearchParams?.verify === 'true';

  return (
    <AuthLayoutWrapper
      title={t("auth.register.title", "Join the Signal.")}
      subtitle={t("auth.register.subtitle", "Set up your profile to start creating, connecting, and sharing on VibeGrid.")}
      badge={t("auth.register.badge", "CLAIM YOUR HANDLE")}
    >
      <RegisterForm initialEmail={initialEmail} initialVerify={initialVerify} />
    </AuthLayoutWrapper>
  );
}
