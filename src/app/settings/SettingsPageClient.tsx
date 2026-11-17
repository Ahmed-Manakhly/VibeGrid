'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, Sparkles, Settings, FileText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ProfileSettingsForm } from '@/modules/social/presentation/components/ProfileSettingsForm';
import { FeedPreferencesSettingsForm } from '@/modules/social/presentation/components/FeedPreferencesSettingsForm';
import { SecuritySettingsForm } from '@/modules/auth/presentation/components/SecuritySettingsForm';
import { PlatformPolicyCenter } from '@/components/settings/PlatformPolicyCenter';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const validTabs = ['personalization', 'profile', 'security', 'policy'];
  
  const getSanitizedTab = (tab: string | null) =>
    tab && validTabs.includes(tab) ? tab : 'personalization';

  const [activeTab, setActiveTab] = useState(() => getSanitizedTab(requestedTab));

  useEffect(() => {
    if (requestedTab && validTabs.includes(requestedTab) && requestedTab !== activeTab) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.replace(`/settings?tab=${val}`, { scroll: false });
  };

  return (
    <div className="w-full py-2 px-0 space-y-6">
      <PageHeader
        eyebrow="PREFERENCES & CONFIG"
        title="Account Settings"
        subtitle="Manage your feed personalization, profile identity, security, and platform compliance."
        icon={Settings}
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full min-w-0 flex-1">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                <TabsTrigger
                  value="policy"
                  className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
                >
                  <FileText className="size-4 shrink-0" />
                  <span>Policy Center</span>
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

            <TabsContent value="policy" className="mt-6 space-y-6">
              <PlatformPolicyCenter />
            </TabsContent>
          </Tabs>
        </div>

        <SettingsSidebar user={user} />
      </div>
    </div>
  );
}
