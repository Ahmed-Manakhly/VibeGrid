import React from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  Users,
  AlertTriangle,
  UserPlus,
  MessageSquare,
  Shield,
  Globe,
  Radio,
} from 'lucide-react';
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
            Effective Date: November 2026 • Version 1.1.0 • Living Policy Document
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground leading-relaxed">
          VibeGrid is an engineering-first social network built for high-signal developer collaboration, project shipping, and technical problem-solving. By registering and utilizing VibeGrid, all developers, contributors, and organizations agree to adhere strictly to the policies and privacy boundaries outlined below.
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
            <p>• <strong>Malicious Code & Exploits:</strong> Publishing malicious payloads, malware, cryptominers, or unauthorized vulnerability exploits is strictly forbidden.</p>
            <p>• <strong>Credential & Secret Protection:</strong> Never post live API keys, private keys, database credentials, or sensitive enterprise tokens in public vibes, comments, or attachments.</p>
            <p>• <strong>Rate Limits & Bot Automation:</strong> Automated API interactions must respect platform quotas and authenticate via approved machine tokens.</p>
          </CardContent>
        </Card>

        {/* 3. Follow & Social Connection Policy */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <UserPlus className="size-4 text-cyan-400" />
              <CardTitle className="text-sm font-semibold">3. Follow & Social Connection Policy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Organic Following:</strong> Follow connections must represent genuine developer interest. Mass-following, aggressive churn (follow/unfollow spam), and automated follower farming bots are prohibited.</p>
            <p>• <strong>Policy Prerequisite Gate:</strong> To maintain community integrity, new accounts must accept the Platform Policy before following developers, posting vibes, or commenting.</p>
            <p>• <strong>Automatic Severance:</strong> Blocking a user triggers an immediate, transactional severance of all mutual follow links between both accounts.</p>
          </CardContent>
        </Card>

        {/* 4. Comment & Discussion Policy */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <MessageSquare className="size-4 text-teal-400" />
              <CardTitle className="text-sm font-semibold">4. Comment & Discussion Policy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Constructive Technical Review:</strong> Comments, code reviews, and replies must provide constructive feedback, reproduction steps, or verified architectural insight.</p>
            <p>• <strong>Media & Screenshot Etiquette:</strong> Technical diagrams, UI mockups, bug screenshots, and architectural flowcharts uploaded to comments or replies must be relevant to the discussion and stored securely in platform object storage (MinIO).</p>
            <p>• <strong>Zero Spam & Duplicate Throttling:</strong> Duplicate comments, automated promotional messages, and repetitive filler text are automatically throttled and flagged for moderation.</p>
          </CardContent>
        </Card>

        {/* 5. Chat & Direct Messaging Policy */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <Radio className="size-4 text-indigo-400" />
              <CardTitle className="text-sm font-semibold">5. Chat & Direct Messaging Policy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Safe & Professional Messaging:</strong> 1-on-1 direct messages and guild group conversations are reserved for professional technical collaboration. Unsolicited sales pitches, harassment, or abusive direct messaging are zero-tolerance offenses.</p>
            <p>• <strong>ModelLink Dual-Copy Chat:</strong> Deleting a conversation clears the chat history for your account only (&quot;Delete for Me&quot;) using independent participant timestamps, preserving the counterparty&apos;s copy unless all participants purge the room.</p>
            <p>• <strong>Scoped Message Deletion:</strong> Unread messages may be &quot;Deleted for Everyone&quot;. Once read by the recipient, deletion is restricted to &quot;Delete for Me&quot;.</p>
          </CardContent>
        </Card>

        {/* 6. Route Protection & Security Monitoring */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <Shield className="size-4 text-violet-400" />
              <CardTitle className="text-sm font-semibold">6. Route Protection & Security Monitoring</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Edge Middleware Authentication:</strong> Authenticated routes (including <code>/profile</code>, <code>/settings</code>, <code>/messages</code>, <code>/notifications</code>, <code>/bookmarks</code>, and <code>/create-post</code>) are protected at the edge by RS256 asymmetric cryptographic JWT verification with silent refresh rotation.</p>
            <p>• <strong>CSRF & Origin Guard:</strong> All state-changing HTTP requests (POST, PUT, PATCH, DELETE) enforce origin and referer domain verification to prevent cross-site request forgery.</p>
            <p>• <strong>Request Correlation Telemetry:</strong> Every request is tagged with an immutable <code>X-Request-ID</code> header for real-time security auditing and anomaly detection, without ever logging passwords, keys, or personal credentials.</p>
          </CardContent>
        </Card>

        {/* 7. Private vs. Public Visibility Architecture */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <Globe className="size-4 text-sky-400" />
              <CardTitle className="text-sm font-semibold">7. Private vs. Public Spaces</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Public Developer Spaces:</strong> Global feed vibes, developer profile portfolios (<code>/profile/:username</code>), and public community guild vibes are accessible to the developer community for discovery and indexing.</p>
            <p>• <strong>Private Guilds & Spaces:</strong> Private Guilds (<code>isPrivate: true</code>) restrict vibe visibility, member rosters, and internal discussions exclusively to approved guild members.</p>
            <p>• <strong>Private Personal Spaces:</strong> Direct messages, bookmarks, security settings, and draft vibes are strictly private to the authenticated account owner.</p>
          </CardContent>
        </Card>

        {/* 8. Trust, Safety & Cascade Blocking */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="size-4 text-rose-400" />
              <CardTitle className="text-sm font-semibold">8. Trust, Safety & Cascade Blocking</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Cascade Blocking:</strong> Blocking a developer triggers a transactional cascade that automatically severs mutual follows, clears and archives shared direct conversations, and immediately evicts the blocker from any guilds created by the blocked developer.</p>
            <p>• <strong>Bidirectional Search & Feed Isolation:</strong> Blocked parties are completely masked from global search autocomplete, profile views, guild rosters, and discovery feeds.</p>
          </CardContent>
        </Card>

        {/* 9. Community Guilds & Moderation */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="size-4 text-amber-400" />
              <CardTitle className="text-sm font-semibold">9. Guild Governance & Moderation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Guild Admin Responsibility:</strong> Guild creators and moderators are responsible for maintaining civilized, on-topic discourse within their spaces.</p>
            <p>• <strong>Reporting Protocol:</strong> Users can flag policy-violating content using the inline Report button. Reports are reviewed by human administrators.</p>
            <p>• <strong>Enforcement Ladder:</strong> Infractions may result in content deletion, temporary shadow-muting, or permanent account revocation.</p>
          </CardContent>
        </Card>

        {/* 10. Data Privacy & Portability */}
        <Card className="border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-foreground">
              <FileText className="size-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold">10. Data Privacy & Ownership</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <p>• <strong>Your Code & Content:</strong> You retain ownership of your original code snippets, ships, and vibes published on the platform.</p>
            <p>• <strong>Data Portability:</strong> You may download an archival export of your profile and platform data at any time via Settings.</p>
            <p>• <strong>Right to Deletion:</strong> Deleting your account irrevocably detaches your personal identity and removes active sessions.</p>
            <p>• <strong>30-Day Activity Pruning:</strong> Social notifications and activity indicators older than 30 days are automatically pruned from platform storage.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
