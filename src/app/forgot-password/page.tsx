import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { AuthLayoutWrapper } from '@/components/auth/AuthLayoutWrapper';
import { generatePageMetadata } from '@/lib/seo';

export const metadata = generatePageMetadata({
  title: 'Forgot Password',
  description: 'Request a password reset OTP code for your VibeGrid account.',
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <AuthLayoutWrapper
      title="Recover your signal."
      subtitle="Enter your email to receive a password reset verification code."
      badge="PASSWORD RECOVERY"
    >
      <ForgotPasswordForm />
    </AuthLayoutWrapper>
  );
}
