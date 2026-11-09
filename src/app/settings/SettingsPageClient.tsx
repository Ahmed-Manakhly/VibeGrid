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
        <TabsList className="w-full flex items-center justify-start flex-wrap border-b border-border/50 bg-transparent p-0 rounded-none h-auto gap-x-4 sm:gap-x-6 gap-y-1">
          <TabsTrigger
            value="personalization"
            className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-0.5 text-xs sm:text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
          >
            <Sparkles className="size-3.5 sm:size-4 shrink-0" />
            <span>Personalization</span>
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-0.5 text-xs sm:text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
          >
            <User className="size-3.5 sm:size-4 shrink-0" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-0.5 text-xs sm:text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
          >
            <Shield className="size-3.5 sm:size-4 shrink-0" />
            <span>Security</span>
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
