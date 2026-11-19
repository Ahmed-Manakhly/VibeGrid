'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from '@/components/ui/toast';
import { useInput } from '@/shared/presentation/hooks/useInput';
import { validateEmail, validatePassword, validateRequired, normalizeEmail } from '@/shared/utils/validation';

interface UseRegisterFormProps {
  initialEmail?: string
  initialVerify?: boolean
}

export function useRegisterForm({ initialEmail = '', initialVerify = false }: UseRegisterFormProps) {
  const router = useRouter()

  const nameInput = useInput({
    validators: [(val) => validateRequired(val, 'Display name')],
  });

  const emailInput = useInput({
    initialValue: initialEmail ? normalizeEmail(initialEmail) : '',
    validators: [validateEmail],
  });

  const passwordInput = useInput({
    validators: [validatePassword],
  });

  const passwordConfirmInput = useInput({
    validators: [(val) => validateRequired(val, 'Confirm password')],
  });

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agreedToPolicy, setAgreedToPolicy] = useState(false)

  // Step 2: Verification State
  const [requiresVerification, setRequiresVerification] = useState(initialVerify)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    nameInput.inputBlurHandler();
    emailInput.inputBlurHandler();
    passwordInput.inputBlurHandler();
    passwordConfirmInput.inputBlurHandler();

    if (!nameInput.valueIsValid) {
      const err = nameInput.errorMessage || 'Please enter display name';
      setFormError(err);
      toast.error(err);
      return;
    }

    if (!emailInput.valueIsValid) {
      const err = emailInput.errorMessage || 'Please enter a valid email';
      setFormError(err);
      toast.error(err);
      return;
    }

    if (!passwordInput.valueIsValid) {
      const err = passwordInput.errorMessage || 'Invalid password';
      setFormError(err);
      toast.error(err);
      return;
    }

    if (passwordInput.value !== passwordConfirmInput.value) {
      const err = 'Passwords do not match';
      setFormError(err);
      toast.error(err);
      return;
    }

    if (!agreedToPolicy) {
      const err = 'You must review and accept the Platform Policy & Terms to create an account.';
      setFormError(err);
      toast.error(err);
      return;
    }

    setIsSubmitting(true)
    try {
      const normalizedEmail = normalizeEmail(emailInput.value);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value,
          email: normalizedEmail,
          password: passwordInput.value,
          passwordConfirm: passwordConfirmInput.value,
          agreedToPolicy: true,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        const msg = data.message || 'Registration failed'
        setFormError(msg)
        toast.error(msg)
        setIsSubmitting(false)
        return
      }

      if (data.requiresEmailVerification) {
        setRequiresVerification(true)
        toast.success('Registration successful! Please check your email for the verification code.')
      } else {
        toast.success('Account created successfully!')
        router.push('/login')
      }
    } catch {
      const msg = 'An unexpected error occurred'
      setFormError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!verificationCode || verificationCode.trim().length !== 6) {
      const err = 'Please enter a valid 6-digit verification code'
      setFormError(err)
      toast.error(err)
      return
    }

    setIsVerifying(true)
    try {
      const normalizedEmail = normalizeEmail(emailInput.value);
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, code: verificationCode.trim() }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        const msg = data.message || 'Verification failed'
        setFormError(msg)
        toast.error(msg)
        setIsVerifying(false)
        return
      }

      toast.success('Email verified successfully! Logging you in...');

      // Auto-login after verification using saved credentials
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password: passwordInput.value,
        }),
      });
      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.success) {
        toast.success(`Welcome to VibeGrid, ${nameInput.value || 'friend'}! 🚀`);
        window.location.href = '/';
      } else {
        router.push('/login');
      }
    } catch {
      const msg = 'Verification failed';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const normalizedEmail = normalizeEmail(emailInput.value);
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Verification code resent!')
      } else {
        toast.error(data.message || 'Failed to resend code')
      }
    } catch {
      toast.error('Failed to resend verification code')
    }
  }

  return {
    name: nameInput.value,
    setName: nameInput.setValue,
    nameHasError: nameInput.hasError,
    nameError: nameInput.errorMessage,
    nameBlur: nameInput.inputBlurHandler,

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

    passwordConfirm: passwordConfirmInput.value,
    setPasswordConfirm: passwordConfirmInput.setValue,
    passwordConfirmHasError: passwordConfirmInput.hasError,
    passwordConfirmError: passwordConfirmInput.errorMessage,
    passwordConfirmBlur: passwordConfirmInput.inputBlurHandler,

    showPassword,
    setShowPassword,
    showPasswordConfirm,
    setShowPasswordConfirm,
    agreedToPolicy,
    setAgreedToPolicy,
    isSubmitting,
    requiresVerification,
    verificationCode,
    setVerificationCode,
    isVerifying,
    formError,
    handleRegister,
    handleVerifyEmail,
    handleResendCode,
  }
}
