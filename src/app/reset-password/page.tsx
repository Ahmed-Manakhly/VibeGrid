import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { AuthLayoutWrapper } from '@/components/auth/AuthLayoutWrapper';
import { Suspense } from 'react';

export const metadata = {
  title: 'Reset Password | VibeGrid',
  description: 'Enter your OTP code and new password to restore account access.',
};

export default function ResetPasswordPage() {
  return (
    <AuthLayoutWrapper
      title="Restore your signal."
      subtitle="Enter the OTP code received via email to set your new password."
      badge="PASSWORD RESET"
    >
      <Suspense fallback={<div className="p-8 text-center text-sm font-mono animate-pulse">Loading reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayoutWrapper>
  );
}
