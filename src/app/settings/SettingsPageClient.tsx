'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, LogOut, Sparkles } from 'lucide-react';
import { ProfileSettingsForm } from '@/modules/social/presentation/components/ProfileSettingsForm';
import { FeedPreferencesSettingsForm } from '@/modules/social/presentation/components/FeedPreferencesSettingsForm';
import { SecuritySettingsForm } from '@/modules/auth/presentation/components/SecuritySettingsForm';
import { useSession } from '@/components/auth/SessionProvider';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

interface SettingsPageClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    username: string;
    bio: string | null;
    location: string | null;
    website: string | null;
    image: string | null;
    role: string;
    createdAt: Date;
  };
}

export default function SettingsPageClient({ user }: SettingsPageClientProps) {
  const { logout } = useSession();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const defaultTab = requestedTab === 'personalization' || requestedTab === 'security' ? requestedTab : 'personalization';

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your feed personalization, profile identity, and security preferences.</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-2 text-destructive">
          <LogOut className="size-4" /> Sign Out
        </Button>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="personalization" className="flex items-center gap-2">
            <Sparkles className="size-4" /> Personalization
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="size-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="size-4" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personalization" className="mt-6 space-y-6">
          <FeedPreferencesSettingsForm />
        </TabsContent>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <ProfileSettingsForm user={user} />
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <SecuritySettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
