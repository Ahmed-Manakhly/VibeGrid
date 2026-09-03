'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'OTP reset code sent to your email!');
        router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
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
