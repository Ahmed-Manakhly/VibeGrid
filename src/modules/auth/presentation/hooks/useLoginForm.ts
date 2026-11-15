'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/auth/SessionProvider';
import { toast } from '@/components/ui/toast';
import { useInput } from '@/shared/presentation/hooks/useInput';
import { validateEmail, validateRequired, normalizeEmail } from '@/shared/utils/validation';

interface UseLoginFormProps {
  callbackUrl?: string;
}

export function useLoginForm({ callbackUrl = '/' }: UseLoginFormProps) {
  const router = useRouter();
  const { isAuthenticated, refreshSession } = useSession();

  const emailInput = useInput({
    validators: [validateEmail],
  });

  const passwordInput = useInput({
    validators: [(val) => validateRequired(val, 'Password')],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = callbackUrl;
    }
  }, [isAuthenticated, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger blur on submit to ensure error feedback shows if touched or submit attempted
    emailInput.inputBlurHandler();
    passwordInput.inputBlurHandler();

    if (!emailInput.valueIsValid) {
      toast.error(emailInput.errorMessage || 'Invalid email address');
      return;
    }
    if (!passwordInput.valueIsValid) {
      toast.error(passwordInput.errorMessage || 'Password is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedEmail = normalizeEmail(emailInput.value);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: passwordInput.value }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.isEmailUnverified) {
          toast.error(data.message || 'Email address is not verified.');
          router.push(`/register?email=${encodeURIComponent(emailInput.value)}&verify=true`);
          return;
        }

        toast.error(data.message || 'Invalid credentials');
        setIsSubmitting(false);
        return;
      }

      const userName = data?.user?.name || data?.user?.username || data?.user?.email?.split('@')[0] || 'friend';
      toast.success(`Welcome to VibeGrid, ${userName}! 🚀`);
      await refreshSession();
      window.location.href = callbackUrl;
    } catch {
      toast.error('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  return {
    email: emailInput.value,
    setEmail: emailInput.setValue,
    emailHasError: emailInput.hasError,
    emailError: emailInput.errorMessage,
    emailBlur: emailInput.inputBlurHandler,

    password: passwordInput.value,
    setPassword: passwordInput.setValue,
    passwordHasError: passwordInput.hasError,
    passwordError: passwordInput.errorMessage,
    passwordBlur: passwordInput.inputBlurHandler,

    showPassword,
    toggleShowPassword,
    isSubmitting,
    handleSubmit,
  };
}
