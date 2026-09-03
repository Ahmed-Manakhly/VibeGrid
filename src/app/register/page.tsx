'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound, Loader2, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { VibeLogo } from '@/components/VibeLogo'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const initialVerify = searchParams.get('verify') === 'true'

  const [name, setName] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 2: Verification State
  const [requiresVerification, setRequiresVerification] = useState(initialVerify)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)


  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
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
        const errMsg = data.message || 'Registration failed'
        setFormError(errMsg)
        toast.error(errMsg)
        setIsSubmitting(false)
        return
      }

      toast.success(data.message || 'Account created! Please check your email for the verification code.')
      setRequiresVerification(true)
    } catch {
      const err = 'An unexpected error occurred'
      setFormError(err)
      toast.error(err)
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

            {formError && (
              <div className="mt-4 p-3 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive text-xs leading-relaxed font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-6 flex flex-col gap-5">
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
                    placeholder="Uppercase, lowercase, number & special char"
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
                <span className="text-[10px] text-muted-foreground mt-1">
                  Must include 1 uppercase, 1 lowercase, 1 number, and 1 special character (e.g. Vibe#2026!).
                </span>
              </label>
              <label className="auth-label">
                Confirm Password
                <div className="auth-input-wrap">
                  <LockKeyhole />
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showPasswordConfirm ? <EyeOff /> : <Eye />}
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

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">OR</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={`${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8000'}/api/auth/oauth/google`}
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
                href={`${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8000'}/api/auth/oauth/github`}
                className="h-11 rounded-xl border border-input bg-background/50 hover:bg-accent/10 hover:border-accent/40 font-medium text-sm flex items-center justify-center gap-2.5 transition-all"
              >
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>Continue with GitHub</span>
              </a>
            </div>
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

