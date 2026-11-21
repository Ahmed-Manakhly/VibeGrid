import { LoginForm } from '@/modules/auth/presentation/components/LoginForm';
import { AuthLayoutWrapper } from '@/components/auth/AuthLayoutWrapper';
import { generatePageMetadata } from '@/lib/seo';

export const metadata = generatePageMetadata({
  title: 'Log In',
  description: 'Log in to your VibeGrid account to access developer discussions, guilds, and code snippets.',
  url: '/login',
});

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }> | { callbackUrl?: string };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl || '/';

  return (
    <AuthLayoutWrapper
      title="Return to your signal."
      subtitle="Pick up where the good ideas left off. Enter your credentials to access your VibeGrid account."
      badge="WELCOME BACK"
    >
      <div className="text-left mb-6">
        <p className="eyebrow text-brand-gold font-mono text-xs uppercase tracking-wider font-semibold">ACCOUNT ACCESS</p>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mt-1">
          Log in to VibeGrid
        </h2>
      </div>
      
      <LoginForm callbackUrl={callbackUrl} />
    </AuthLayoutWrapper>
  );
}
