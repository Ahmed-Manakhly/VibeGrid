'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from '@/components/ui/toast';

interface UseRegisterFormProps {
  initialEmail?: string
  initialVerify?: boolean
}

export function useRegisterForm({ initialEmail = '', initialVerify = false }: UseRegisterFormProps) {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 2: Verification State
  const [requiresVerification, setRequiresVerification] = useState(initialVerify)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name || !email || !password || !passwordConfirm) {
      const err = 'Please fill in all fields'
      setFormError(err)
      toast.error(err)
      return
    }

    if (password.trim() !== passwordConfirm.trim()) {
      const err = 'Passwords do not match'
      setFormError(err)
      toast.error(err)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, passwordConfirm }),
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
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode.trim() }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        const msg = data.message || 'Verification failed'
        setFormError(msg)
        toast.error(msg)
        setIsVerifying(false)
        return
      }

      toast.success('Email verified successfully! You can now log in.')
      router.push('/login')
    } catch {
      const msg = 'Verification failed'
      setFormError(msg)
      toast.error(msg)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    passwordConfirm,
    setPasswordConfirm,
    showPasswordConfirm,
    setShowPasswordConfirm,
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
