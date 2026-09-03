import Metadata from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { VibeLogo } from '@/components/VibeLogo';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Log In | VibeGrid',
  description: 'Log in to your VibeGrid account to access your signal, profile, and community.',
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }> | { callbackUrl?: string };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl || '/';

  return (
    <main className="auth-page">
      <div className="auth-orbit auth-orbit-one" />
      <div className="auth-orbit auth-orbit-two" />
      <div className="absolute left-6 top-6">
        <Link href="/" className="back-link">
          <ArrowLeft /> Back to the grid
        </Link>
      </div>
      <section className="auth-card">
        <div className="flex justify-center">
          <VibeLogo />
        </div>
        <div className="mt-10 text-center">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">
            Return to your signal.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Pick up where the good ideas left off.
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
