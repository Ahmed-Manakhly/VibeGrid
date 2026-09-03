'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { VibeLogo } from '@/components/VibeLogo'
import { useSession } from '@/components/auth/SessionProvider'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const { refreshSession } = useSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        if (data.isEmailUnverified) {
          toast.error(data.message || 'Email address is not verified. Redirecting to verification...')
          setTimeout(() => {
            router.push(`/register?email=${encodeURIComponent(email)}&verify=true`)
          }, 1500)
          return
        }

        toast.error(data.message || 'Invalid credentials')
        setIsSubmitting(false)
        return
      }

      toast.success('Welcome back!')
      await refreshSession()
      router.push(callbackUrl)
    } catch {
      toast.error('An unexpected error occurred')
      setIsSubmitting(false)
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
        <div className="mt-10 text-center">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">
            Return to your signal.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Pick up where the good ideas left off.
          </p>
        </div>
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
      </section>
    </main>
  )
}

