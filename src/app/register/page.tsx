'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound, Loader2, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { VibeLogo } from '@/components/VibeLogo'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 2: Verification State
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Registration failed')
        setIsSubmitting(false)
        return
      }

      toast.success(data.message || 'Account created! Please check your email for the verification code.')
      setRequiresVerification(true)
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationCode) {
      toast.error('Please enter the verification code')
      return
    }

    setIsVerifying(true)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Verification failed')
        setIsVerifying(false)
        return
      }

      toast.success('Email verified successfully! You can now log in.')
      router.push('/login')
    } catch {
      toast.error('Verification error')
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Verification code resent!')
      } else {
        toast.error(data.message || 'Failed to resend code')
      }
    } catch {
      toast.error('Failed to resend code')
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-orbit auth-orbit-one" />
      <div className="auth-orbit auth-orbit-two" />
      <div className="absolute left-6 top-6">
        <Link href="/" className="back-link">
          <ArrowLeft /> Back to the grid
        </Link>
      </div>
      <section className="auth-card">
        <div className="flex justify-center">
          <VibeLogo />
        </div>

        {!requiresVerification ? (
          <>
            <div className="mt-10 text-center">
              <p className="eyebrow">Join the signal</p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">
                Find your frequency.
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Make space for the things worth noticing.
              </p>
            </div>
            <form onSubmit={handleRegister} className="mt-9 flex flex-col gap-5">
              <label className="auth-label">
                Display name
                <div className="auth-input-wrap">
                  <UserRound />
                  <input
                    type="text"
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </label>
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
                    placeholder="At least 8 characters"
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
              <button
                className="button-glow h-12 rounded-xl font-semibold flex items-center justify-center gap-2"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin size-5" /> : 'Create account'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mt-10 text-center">
              <p className="eyebrow">Verify your email</p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">
                Enter OTP Code
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                We sent a verification code to <span className="font-medium text-foreground">{email}</span>.
              </p>
            </div>
            <form onSubmit={handleVerify} className="mt-9 flex flex-col gap-5">
              <label className="auth-label">
                Verification Code
                <div className="auth-input-wrap">
                  <KeyRound />
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                  />
                </div>
              </label>
              <button
                className="button-glow h-12 rounded-xl font-semibold flex items-center justify-center gap-2"
                type="submit"
                disabled={isVerifying}
              >
                {isVerifying ? <Loader2 className="animate-spin size-5" /> : 'Verify Email'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResend}
                className="text-xs text-primary hover:underline"
              >
                Didn&apos;t receive a code? Resend
              </button>
            </div>
          </>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already on the grid?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </section>
    </main>
  )
}

