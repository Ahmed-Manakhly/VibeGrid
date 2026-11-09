'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, Sparkles } from 'lucide-react';
import { ProfileSettingsForm } from '@/modules/social/presentation/components/ProfileSettingsForm';
import { FeedPreferencesSettingsForm } from '@/modules/social/presentation/components/FeedPreferencesSettingsForm';
import { SecuritySettingsForm } from '@/modules/auth/presentation/components/SecuritySettingsForm';
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
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const defaultTab = requestedTab === 'personalization' || requestedTab === 'security' ? requestedTab : 'personalization';

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your feed personalization, profile identity, and security preferences.</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="w-full flex justify-center sm:justify-start">
          <TabsList className="inline-flex w-auto p-1.5 rounded-2xl bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-sm gap-1.5 shrink-0">
            <TabsTrigger value="personalization" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all shrink-0">
              <Sparkles className="size-3.5 sm:size-4 shrink-0" />
              <span>Personalization</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all shrink-0">
              <User className="size-3.5 sm:size-4 shrink-0" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all shrink-0">
              <Shield className="size-3.5 sm:size-4 shrink-0" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>
        </div>

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
