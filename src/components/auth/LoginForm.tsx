'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, LockKeyhole, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useSession } from '@/components/auth/SessionProvider';
import toast from 'react-hot-toast';

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = '/' }: LoginFormProps) {
  const router = useRouter();
  const { isAuthenticated, refreshSession } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = callbackUrl;
    }
  }, [isAuthenticated, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.isEmailUnverified) {
          toast.error(data.message || 'Email address is not verified. Redirecting to verification...');
          setTimeout(() => {
            router.push(`/register?email=${encodeURIComponent(email)}&verify=true`);
          }, 1500);
          return;
        }

        toast.error(data.message || 'Invalid credentials');
        setIsSubmitting(false);
        return;
      }

      toast.success('Welcome back!');
      await refreshSession();
      window.location.href = callbackUrl;
    } catch {
      toast.error('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

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
              onClick={() => setShowPassword(!showPassword)}
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
