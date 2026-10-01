'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/UserAvatar';
import { updateProfile } from '@/actions/profile.action';
import { useSession } from '@/components/auth/SessionProvider';
import { toast } from '@/components/ui/toast';
import { Sparkles, CheckCircle2, User, Camera } from 'lucide-react';

interface CompleteProfileClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    username: string;
    bio: string | null;
    image: string | null;
  };
}

export function CompleteProfileClient({ user }: CompleteProfileClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useSession();

  const rawCallback = searchParams.get('callbackUrl') || '/';
  const callbackUrl = rawCallback.startsWith('/') && !rawCallback.startsWith('//') ? rawCallback : '/';

  const [form, setForm] = useState({
    name: user.name || '',
    username: user.username && !user.username.startsWith('user_') ? user.username : '',
    bio: user.bio || '',
    image: user.image || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (!form.name.trim()) {
      toast.error('Display Name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('username', form.username.trim());
      formData.append('name', form.name.trim());
      formData.append('bio', form.bio.trim());
      if (form.image) {
        formData.append('image', form.image);
      }

      const res = await updateProfile(formData);

      if (res.success && res.user) {
        toast.success('Profile completed successfully!');
        await refreshSession();
        const nextUrl = res.user.username ? `/profile/${res.user.username}` : callbackUrl;
        router.push(nextUrl);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to complete profile');
      }
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-mono text-xs font-semibold">
            <Sparkles className="size-3.5" /> ONBOARDING STEP 1
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Choose your unique handle and display name to start dropping vibes and connecting across VibeGrid.
          </p>
        </div>

        <Card className="border-border/50 shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="size-5 text-accent" /> Account Info
            </CardTitle>
            <CardDescription>
              Signed in as <span className="font-medium text-foreground">{user.email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-4 py-2 border-b border-border/40 pb-4">
                <div className="relative group">
                  <UserAvatar src={form.image || user.image} name={form.name || form.username} className="size-16" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{form.name || 'Your Name'}</p>
                  <p className="text-xs text-muted-foreground font-mono">@{form.username || 'username'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="e.g. alex_rivera"
                  required
                  maxLength={30}
                  className="font-mono"
                />
                <p className="text-[11px] text-muted-foreground">Unique handle using letters, numbers, and underscores.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Alex Rivera"
                  required
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bio <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Software engineer, open source enthusiast..."
                  maxLength={160}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full font-semibold gap-2">
                {isSubmitting ? (
                  'Saving Profile...'
                ) : (
                  <>
                    Complete & Continue <CheckCircle2 className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
