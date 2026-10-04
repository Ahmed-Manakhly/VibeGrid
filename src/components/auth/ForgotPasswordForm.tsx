'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, KeyRound } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { useInput } from '@/shared/presentation/hooks/useInput';
import { validateEmail } from '@/shared/utils/validation';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInput = useInput({
    validators: [validateEmail],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    emailInput.inputBlurHandler();

    if (!emailInput.valueIsValid) {
      toast.error(emailInput.errorMessage || 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'OTP reset code sent to your email!');
        router.push(`/reset-password?email=${encodeURIComponent(emailInput.value.trim())}`);
      } else {
        toast.error(data.message || 'Failed to send password reset code');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-left mb-6">
        <p className="eyebrow text-accent font-mono text-xs uppercase tracking-wider font-semibold">RESET PASSWORD</p>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mt-1">
          Forgot your password?
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your registered email address and we&apos;ll send you a password reset OTP code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="auth-label">
          Email address
          <div className={`auth-input-wrap ${emailInput.hasError ? 'border-destructive ring-1 ring-destructive' : ''}`}>
            <Mail />
            <input
              type="email"
              placeholder="you@example.com"
              value={emailInput.value}
              onChange={(e) => emailInput.setValue(e.target.value)}
              onBlur={emailInput.inputBlurHandler}
              required
            />
          </div>
          {emailInput.hasError && emailInput.errorMessage && (
            <span className="text-[11px] font-medium text-destructive mt-1 block">{emailInput.errorMessage}</span>
          )}
        </label>

        <button
          className="btn-gradient h-12 rounded-xl font-semibold flex items-center justify-center gap-2"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin size-5" />
              Sending OTP...
            </>
          ) : (
            <>
              <KeyRound className="size-5" />
              Send Reset Code
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remembered your password?{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
}
