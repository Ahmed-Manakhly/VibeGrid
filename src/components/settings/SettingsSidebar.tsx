'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Laptop, Lock, AlertTriangle, Download, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface SettingsSidebarProps {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    createdAt: Date;
  };
}

export function SettingsSidebar({ user }: SettingsSidebarProps) {
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-6">
      {/* 1. Account Security Health Card */}
      <Card className="border border-white/10 bg-card/60 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <CardTitle className="text-base font-semibold">Security Health</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Account protection & auth status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
            <span className="text-muted-foreground">Auth Provider</span>
            <span className="font-mono text-foreground font-medium">Session Active</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
            <span className="text-muted-foreground">Role Clearance</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-primary/10 text-primary border border-primary/20">
              {user.role}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
            <span className="text-muted-foreground">Member Since</span>
            <span className="text-foreground">{memberSince}</span>
          </div>

          <div className="pt-2">
            <Link
              href="/settings?tab=security"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
            >
              Update Security Credentials <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 2. Active Session & Device Card */}
      <Card className="border border-white/10 bg-card/60 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-foreground">
            <Laptop className="size-5 text-emerald-400" />
            <CardTitle className="text-base font-semibold">Active Session</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Current browsing environment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs">
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
            <div className="size-2 mt-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-foreground">Current Workstation</p>
              <p className="text-[11px] text-muted-foreground truncate">
                Linux • Verified Web Client
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Account Data & Danger Zone Snapshot */}
      <Card className="border border-white/10 bg-card/60 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="size-4" />
            <CardTitle className="text-sm font-semibold">Data & Privacy</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs border-white/10 hover:bg-white/5"
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                exportedAt: new Date().toISOString(),
              }, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `vibegrid_account_${user.username}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
          >
            <Download className="size-3.5 mr-2 text-primary" />
            Export My Account Data
          </Button>

          <div className="pt-2 text-[11px] text-muted-foreground/70 leading-relaxed">
            Need to delete your account or revoke all tokens? Manage in the <Link href="/settings?tab=security" className="text-primary underline">Security Tab</Link>.
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

