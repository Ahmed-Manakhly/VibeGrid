'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, KeyRound, LockKeyhole, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInput } from '@/shared/presentation/hooks/useInput';
import { validateEmail, validatePassword, validateRequired } from '@/shared/utils/validation';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailInput = useInput({
    initialValue: searchParams.get('email') || '',
    validators: [validateEmail],
  });

  const otpInput = useInput({
    initialValue: searchParams.get('otp') || searchParams.get('code') || '',
    validators: [(val) => validateRequired(val, 'OTP Reset Code')],
  });

  const newPasswordInput = useInput({
    validators: [validatePassword],
  });

  const confirmPasswordInput = useInput({
    validators: [(val) => validateRequired(val, 'Confirm New Password')],
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    emailInput.inputBlurHandler();
    otpInput.inputBlurHandler();
    newPasswordInput.inputBlurHandler();
    confirmPasswordInput.inputBlurHandler();

    if (!emailInput.valueIsValid) {
      toast.error(emailInput.errorMessage || 'Please enter a valid email address');
      return;
    }
    if (!otpInput.valueIsValid) {
      toast.error(otpInput.errorMessage || 'Please enter OTP reset code');
      return;
    }
    if (!newPasswordInput.valueIsValid) {
      toast.error(newPasswordInput.errorMessage || 'Invalid password complexity');
      return;
    }
    if (newPasswordInput.value !== confirmPasswordInput.value) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          otp: otpInput.value.trim(),
          newPassword: newPasswordInput.value,
          confirmPassword: confirmPasswordInput.value,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Password reset successfully!');
        router.push('/login');
      } else {
        toast.error(data.message || 'Password reset failed');
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
        <p className="eyebrow text-accent font-mono text-xs uppercase tracking-wider font-semibold">NEW CREDENTIALS</p>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mt-1">
          Set New Password
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your email, the OTP reset code sent to your inbox, and your new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        <label className="auth-label">
          OTP Reset Code
          <div className={`auth-input-wrap ${otpInput.hasError ? 'border-destructive ring-1 ring-destructive' : ''}`}>
            <KeyRound />
            <input
              type="text"
              placeholder="123456"
              value={otpInput.value}
              onChange={(e) => otpInput.setValue(e.target.value)}
              onBlur={otpInput.inputBlurHandler}
              required
            />
          </div>
          {otpInput.hasError && otpInput.errorMessage && (
            <span className="text-[11px] font-medium text-destructive mt-1 block">{otpInput.errorMessage}</span>
          )}
        </label>

        <label className="auth-label">
          New Password
          <div className={`auth-input-wrap ${newPasswordInput.hasError ? 'border-destructive ring-1 ring-destructive' : ''}`}>
            <LockKeyhole />
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Uppercase, lowercase, number & special char"
              value={newPasswordInput.value}
              onChange={(e) => newPasswordInput.setValue(e.target.value)}
              onBlur={newPasswordInput.inputBlurHandler}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {newPasswordInput.hasError && newPasswordInput.errorMessage && (
            <span className="text-[11px] font-medium text-destructive mt-1 block">{newPasswordInput.errorMessage}</span>
          )}
        </label>

        <label className="auth-label">
          Confirm New Password
          <div className={`auth-input-wrap ${confirmPasswordInput.hasError ? 'border-destructive ring-1 ring-destructive' : ''}`}>
            <LockKeyhole />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repeat your new password"
              value={confirmPasswordInput.value}
              onChange={(e) => confirmPasswordInput.setValue(e.target.value)}
              onBlur={confirmPasswordInput.inputBlurHandler}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {confirmPasswordInput.hasError && confirmPasswordInput.errorMessage && (
            <span className="text-[11px] font-medium text-destructive mt-1 block">{confirmPasswordInput.errorMessage}</span>
          )}
        </label>

        <button
          className="btn-gradient h-12 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin size-5" />
              Resetting...
            </>
          ) : (
            <>
              <CheckCircle2 className="size-5" />
              Confirm Reset Password
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Back to{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
