"use client";

import React, { useState } from "react";
import { UnifiedTabsBar } from "@/components/UnifiedTabsBar";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityEntity, CommunityMemberEntity } from "@/modules/community/domain/ICommunityRepository";
import { PostCard } from "@/components/PostCard";
import { LayoutGrid, Info, Users, MessageSquareQuote, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CommunitySpaceViewProps {
  community: CommunityEntity;
  initialPosts: any[];
  initialMembers: CommunityMemberEntity[];
  dbUserId: string | null;
}

export function CommunitySpaceView({
  community,
  initialPosts,
  initialMembers,
  dbUserId,
}: CommunitySpaceViewProps) {
  const [activeTab, setActiveTab] = useState("feed");

  const tabs = [
    { value: "feed", label: `Feed (${initialPosts.length})`, icon: LayoutGrid },
    { value: "about", label: "About & Rules", icon: Info },
    { value: "members", label: `Members (${initialMembers.length})`, icon: Users },
  ];

  return (
    <div className="w-full max-w-4xl py-2 px-0 space-y-4">
      {/* Community Hero Header */}
      <CommunityHeader community={community} />

      {/* Unified Sticky Tabs Bar */}
      <UnifiedTabsBar
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={tabs}
        sticky={true}
      />

      {/* Tab 1: Community Feed */}
      {activeTab === "feed" && (
        <div className="space-y-4">
          {initialPosts.length > 0 ? (
            initialPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                dbUserId={dbUserId}
              />
            ))
          ) : (
            <div className="text-center py-16 bg-card/40 rounded-2xl border border-border/40 p-8 shadow-sm">
              <div className="flex justify-center mb-4 text-muted-foreground">
                <div className="p-4 rounded-full bg-secondary/50 border border-border/40">
                  <MessageSquareQuote className="size-10 opacity-70" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">No Vibes in this Guild Yet</h3>
              <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-5 leading-relaxed">
                Be the pioneer to drop an engineering pulse, tech dilemma, or architecture ship in {community.name}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: About & Guild Rules */}
      {activeTab === "about" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <span>About {community.name}</span>
            </h3>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {community.description || "A collaborative guild built for focused software engineers."}
            </p>

            {community.techTags && community.techTags.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Guild Core Stack
                </h4>
                <div className="flex flex-wrap gap-2">
                  {community.techTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-xs text-foreground font-mono border border-border/40"
                    >
                      #{t.replace(/^#/, "")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="size-5 text-amber-500" />
              <span>Guild Code of Conduct & Rules</span>
            </h3>

            {community.rules && community.rules.length > 0 ? (
              <ol className="space-y-3 list-decimal list-inside text-sm text-foreground/90">
                {community.rules.map((rule, idx) => (
                  <li key={idx} className="leading-relaxed pl-1">
                    <span className="font-medium">{rule}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Standard VibeGrid Community Guidelines apply: Be kind, share high-signal insights, and avoid spam.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Guild Members Roster */}
      {activeTab === "members" && (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <span>Community Members ({initialMembers.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {initialMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border border-border/40">
                    <AvatarImage src={m.user?.image || undefined} alt={m.user?.name || "Member"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {m.user?.name ? m.user.name.slice(0, 2).toUpperCase() : "MB"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      href={m.user?.username ? `/profile/${m.user.username}` : "#"}
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {m.user?.name || "Developer"}
                    </Link>
                    <div className="text-xs text-muted-foreground font-mono">
                      @{m.user?.username || "dev"}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                    m.role === "ADMIN"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold"
                      : m.role === "MODERATOR"
                      ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                      : "bg-secondary text-muted-foreground border-border/40"
                  }`}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
