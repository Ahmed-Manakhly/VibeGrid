import React from "react";
import Link from "next/link";
import { Users, Flame, Shield } from "lucide-react";
import { TruncatedLinkifiedText } from "@/components/TruncatedLinkifiedText";
import { JoinCommunityButton } from "@/components/community/JoinCommunityButton";
import { CommunityEntity } from "@/modules/community/domain/ICommunityRepository";

interface CommunityCardProps {
  community: CommunityEntity;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const memberCount = community._count?.members || (community as any).memberCount || 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      {/* Top Banner Gradient & Badge */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-lg overflow-hidden">
              {community.avatarUrl ? (
                <img src={community.avatarUrl} alt={community.name} className="size-full object-cover" />
              ) : (
                <Users className="size-6 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/communities/${community.slug}`}
                className="font-semibold text-foreground group-hover:text-primary transition-colors text-base hover:underline block break-words"
              >
                {community.name}
              </Link>
              <div className="text-xs text-muted-foreground font-mono truncate">
                /c/{community.slug}
              </div>
            </div>
          </div>

          {/* Join/Leave Button Micro-Leaf */}
          <JoinCommunityButton
            communityId={community.id}
            communitySlug={community.slug}
            initialIsMember={community.isMember || false}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <TruncatedLinkifiedText
            text={community.description || "A collaborative developer hub on VibeGrid."}
            limit={120}
            className="text-sm text-muted-foreground leading-relaxed break-words"
          />
        </div>

        {/* Tech Stack Tags */}
        {community.techTags && community.techTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {community.techTags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-xs text-muted-foreground font-mono"
              >
                #{tag.replace(/^#/, "")}
              </span>
            ))}
            {community.techTags.length > 4 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-secondary/40 text-xs text-muted-foreground font-mono">
                +{community.techTags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Metrics Footer */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="size-3.5 text-primary/80" />
            <span>{memberCount.toLocaleString()} {memberCount === 1 ? "member" : "members"}</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Flame className="size-3.5 text-amber-500/80" />
            <span>{(community._count?.posts || 0).toLocaleString()} vibes</span>
          </span>
        </div>

        {community.userRole && (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Shield className="size-3" />
            <span>{community.userRole}</span>
          </span>
        )}
      </div>
    </div>
  );
}
