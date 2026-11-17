import React from 'react';
import { ShieldCheck, FileText, Lock, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PlatformPolicyCenter() {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <CardTitle className="text-lg font-bold">VibeGrid Developer Platform Policy</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Effective Date: November 2026 • Version 1.0.0
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground leading-relaxed">
          VibeGrid is an engineering-first social network built for high-signal developer collaboration, project shipping, and technical problem-solving. By registering and utilizing VibeGrid, all developers and organizations agree to adhere strictly to the rules outlined below.
        </CardContent>
      </Card>

      {/* Policy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Developer Code of Conduct */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <Users className="size-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold">1. Developer Code of Conduct</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Respectful Technical Discourse:</strong> Critique code, architecture, and solutions, not individuals. Harassment, hate speech, and discriminatory behavior are strictly prohibited.</p>
            <p>• <strong>High-Signal Content:</strong> VibeGrid is dedicated to software craftsmanship. Spam, deceptive marketing, affiliate link blasting, and SEO farming result in immediate suspension.</p>
            <p>• <strong>Attribution & Authorship:</strong> Do not plagiarize code or impersonate other open-source maintainers or engineering teams.</p>
          </CardContent>
        </Card>

        {/* 2. Platform Security & Acceptable Use */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <Lock className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">2. Security & Acceptable Use</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Malicious Code & Exploits:</strong> Publishing malicious payloads, malware, cryptominers, or unauthorized vulnerability exploits is forbidden.</p>
            <p>• <strong>Credential & Secret Protection:</strong> Never post live API keys, private keys, database credentials, or sensitive enterprise tokens in public vibes or comments.</p>
            <p>• <strong>Rate Limits & Bot Automation:</strong> Automated API interactions must respect platform quotas and authenticate via approved machine tokens.</p>
          </CardContent>
        </Card>

        {/* 3. Community Guilds & Moderation */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="size-4 text-amber-400" />
              <CardTitle className="text-sm font-semibold">3. Guild Governance & Moderation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Guild Admin Responsibility:</strong> Guild creators and moderators are responsible for maintaining civilized, on-topic discourse within their spaces.</p>
            <p>• <strong>Reporting Protocol:</strong> Users can flag policy-violating content using the inline Report button. Reports are reviewed by human administrators.</p>
            <p>• <strong>Enforcement Ladder:</strong> Infractions may result in content deletion, temporary shadow-muting, or permanent account revocation.</p>
          </CardContent>
        </Card>

        {/* 4. Data Privacy & Portability */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <FileText className="size-4 text-sky-400" />
              <CardTitle className="text-sm font-semibold">4. Data Privacy & Ownership</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Your Code & Content:</strong> You retain ownership of your original code snippets, ships, and vibes published on the platform.</p>
            <p>• <strong>Data Portability:</strong> You may download an archival export of your profile and platform data at any time via Settings.</p>
            <p>• <strong>Right to Deletion:</strong> Deleting your account irrevocably detaches your personal identity and removes active sessions.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

