'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, Sparkles, Settings } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ProfileSettingsForm } from '@/modules/social/presentation/components/ProfileSettingsForm';
import { FeedPreferencesSettingsForm } from '@/modules/social/presentation/components/FeedPreferencesSettingsForm';
import { SecuritySettingsForm } from '@/modules/auth/presentation/components/SecuritySettingsForm';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
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
    <div className="w-full py-2 px-0 space-y-6">
      <PageHeader
        eyebrow="PREFERENCES & CONFIG"
        title="Account Settings"
        subtitle="Manage your feed personalization, profile identity, and security preferences."
        icon={Settings}
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full min-w-0 flex-1">
          <Tabs defaultValue={defaultTab} className="w-full">
            <div className="sticky top-[118px] lg:top-16 z-30 py-1 bg-transparent backdrop-blur-md mb-6">
              <TabsList className="w-full flex items-center justify-start flex-wrap border-b border-border/50 bg-transparent p-0 rounded-none h-auto gap-x-4 sm:gap-x-6 gap-y-1">
                <TabsTrigger
                  value="personalization"
                  className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
                >
                  <Sparkles className="size-4 shrink-0" />
                  <span>Personalization</span>
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
                >
                  <User className="size-4 shrink-0" />
                  <span>Profile</span>
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
                >
                  <Shield className="size-4 shrink-0" />
                  <span>Security</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="personalization" className="mt-0 space-y-6">
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

        <SettingsSidebar user={user} />
      </div>
    </div>
  );
}
