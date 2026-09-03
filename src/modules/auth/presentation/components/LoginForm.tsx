'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, LockKeyhole, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLoginForm } from '@/modules/auth/presentation/hooks/useLoginForm';

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = '/' }: LoginFormProps) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    isSubmitting,
    handleSubmit,
  } = useLoginForm({ callbackUrl });

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-5">
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
          Password
          <div className="auth-input-wrap">
            <LockKeyhole />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </label>
        <div className="flex justify-end">
          <Link href="#" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          className="button-glow h-12 rounded-xl font-semibold flex items-center justify-center gap-2"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="animate-spin size-5" /> : 'Log in'}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to the grid?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
