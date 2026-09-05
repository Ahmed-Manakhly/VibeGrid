'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/auth/SessionProvider';
import toast from 'react-hot-toast';

interface UseLoginFormProps {
  callbackUrl?: string;
}

export function useLoginForm({ callbackUrl = '/' }: UseLoginFormProps) {
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
          toast.error(data.message || 'Email address is not verified.');
          router.push(`/register?email=${encodeURIComponent(email)}&verify=true`);
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

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    isSubmitting,
    handleSubmit,
  };
}
