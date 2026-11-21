import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { AuthLayoutWrapper } from '@/components/auth/AuthLayoutWrapper';
import { Suspense } from 'react';
import { generatePageMetadata } from '@/lib/seo';

export const metadata = generatePageMetadata({
  title: 'Reset Password',
  description: 'Enter your OTP code and new password to restore account access.',
  noIndex: true,
});

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
