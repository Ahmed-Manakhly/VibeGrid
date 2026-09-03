import { RegisterForm } from '@/modules/auth/presentation/components/RegisterForm'

export const metadata = {
  title: 'Create Account | VibeGrid',
  description: 'Join VibeGrid to create, connect, and share signals with your community.',
}

interface RegisterPageProps {
  searchParams: Promise<{ email?: string; verify?: string }> | { email?: string; verify?: string }
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = await searchParams
  const initialEmail = resolvedSearchParams?.email || ''
  const initialVerify = resolvedSearchParams?.verify === 'true'

  return <RegisterForm initialEmail={initialEmail} initialVerify={initialVerify} />
}
