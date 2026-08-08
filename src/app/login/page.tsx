'use client'

import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { VibeLogo } from '@/components/VibeLogo'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  return <main className="auth-page"><div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" /><div className="absolute left-6 top-6"><Link href="/" className="back-link"><ArrowLeft /> Back to the grid</Link></div><section className="auth-card"><div className="flex justify-center"><VibeLogo /></div><div className="mt-10 text-center"><p className="eyebrow">Welcome back</p><h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">Return to your signal.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Pick up where the good ideas left off.</p></div><form className="mt-9 flex flex-col gap-5"><label className="auth-label">Email address<div className="auth-input-wrap"><Mail /><input type="email" placeholder="you@example.com" /></div></label><label className="auth-label">Password<div className="auth-input-wrap"><LockKeyhole /><input type={showPassword ? 'text' : 'password'} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label><div className="flex justify-end"><Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link></div><button className="button-glow h-12 rounded-xl font-semibold" type="submit">Log in</button></form><p className="mt-8 text-center text-sm text-muted-foreground">New to the grid? <Link href="/register" className="font-medium text-primary hover:underline">Create an account</Link></p></section></main>
}
