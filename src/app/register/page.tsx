'use client'

import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { VibeLogo } from '@/components/VibeLogo'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  return <main className="auth-page"><div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" /><div className="absolute left-6 top-6"><Link href="/" className="back-link"><ArrowLeft /> Back to the grid</Link></div><section className="auth-card"><div className="flex justify-center"><VibeLogo /></div><div className="mt-10 text-center"><p className="eyebrow">Join the signal</p><h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">Find your frequency.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Make space for the things worth noticing.</p></div><form className="mt-9 flex flex-col gap-5"><label className="auth-label">Display name<div className="auth-input-wrap"><UserRound /><input type="text" placeholder="Alex Rivera" /></div></label><label className="auth-label">Email address<div className="auth-input-wrap"><Mail /><input type="email" placeholder="you@example.com" /></div></label><label className="auth-label">Password<div className="auth-input-wrap"><LockKeyhole /><input type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label><button className="button-glow h-12 rounded-xl font-semibold" type="submit">Create account</button></form><p className="mt-8 text-center text-sm text-muted-foreground">Already on the grid? <Link href="/login" className="font-medium text-primary hover:underline">Log in</Link></p></section></main>
}
