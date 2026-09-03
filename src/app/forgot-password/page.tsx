import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { AuthLayoutWrapper } from '@/components/auth/AuthLayoutWrapper';

export const metadata = {
  title: 'Forgot Password | VibeGrid',
  description: 'Request a password reset OTP code for your VibeGrid account.',
};

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
