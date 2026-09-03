'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, KeyRound, LockKeyhole, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState(searchParams.get('otp') || searchParams.get('code') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !otp.trim() || !newPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
          confirmPassword,
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
          <div className="auth-input-wrap">
            <Mail />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </label>

        <label className="auth-label">
          OTP Reset Code
          <div className="auth-input-wrap">
            <KeyRound />
            <input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
        </label>

        <label className="auth-label">
          New Password
          <div className="auth-input-wrap">
            <LockKeyhole />
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Uppercase, lowercase, number & special char"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
        </label>

        <label className="auth-label">
          Confirm New Password
          <div className="auth-input-wrap">
            <LockKeyhole />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
