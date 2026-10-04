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
    emailHasError,
    emailError,
    emailBlur,

    password,
    setPassword,
    passwordHasError,
    passwordError,
    passwordBlur,

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
          <div className={`auth-input-wrap ${emailHasError ? 'border-destructive ring-1 ring-destructive' : ''}`}>
            <Mail />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={emailBlur}
              required
            />
          </div>
          {emailHasError && emailError && (
            <span className="text-[11px] font-medium text-destructive mt-1 block">{emailError}</span>
          )}
        </label>
        <label className="auth-label">
          Password
          <div className={`auth-input-wrap ${passwordHasError ? 'border-destructive ring-1 ring-destructive' : ''}`}>
            <LockKeyhole />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={passwordBlur}
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
          {passwordHasError && passwordError && (
            <span className="text-[11px] font-medium text-destructive mt-1 block">{passwordError}</span>
          )}
        </label>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          className="btn-gradient h-12 rounded-xl font-semibold flex items-center justify-center gap-2"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="animate-spin size-5" /> : 'Log in'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">OR</span>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      <div className="flex flex-col gap-3">
        <a
          href="/api/auth/oauth/google"
          className="h-11 rounded-xl border border-input bg-background/50 hover:bg-accent/10 hover:border-accent/40 font-medium text-sm flex items-center justify-center gap-2.5 transition-all"
        >
          <svg className="size-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </a>

        <a
          href="/api/auth/oauth/github"
          className="h-11 rounded-xl border border-input bg-background/50 hover:bg-accent/10 hover:border-accent/40 font-medium text-sm flex items-center justify-center gap-2.5 transition-all"
        >
          <svg className="size-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span>Continue with GitHub</span>
        </a>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to the grid?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
