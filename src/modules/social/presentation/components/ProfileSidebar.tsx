import React from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/UserAvatar";
import { TruncatedLinkifiedText } from "@/components/TruncatedLinkifiedText";
import { DeveloperBadgeList } from "@/modules/social/presentation/components/DeveloperBadgeList";
import { ProfileActionButtons } from "@/modules/social/presentation/components/ProfileActionButtons";
import { MapPinIcon, LinkIcon, CalendarIcon } from "lucide-react";
import { t } from "@/lib/copy";

interface ProfileSidebarProps {
  user: {
    id: string;
    username: string;
    name?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    developerLinks?: any;
    techStack?: any;
    image?: string | null;
    createdAt: Date | string;
    _count: {
      following: number;
      followers: number;
      posts: number;
    };
    solutionsCount?: number;
    role?: string;
  };
  currentUserId: string | null;
  isAuthenticated: boolean;
  initialIsFollowing: boolean;
  hasMilestones: boolean;
}

export function ProfileSidebar({
  user,
  currentUserId,
  isAuthenticated,
  initialIsFollowing,
  hasMilestones,
}: ProfileSidebarProps) {
  const formattedDate = format(new Date(user.createdAt), "MMMM yyyy");

  const techStackList: string[] = user.techStack
    ? Array.isArray(user.techStack)
      ? user.techStack
      : JSON.parse(user.techStack || "[]")
    : [];

  const devLinks: Array<{ type: string; url: string; label?: string }> = user.developerLinks
    ? Array.isArray(user.developerLinks)
      ? user.developerLinks
      : JSON.parse(user.developerLinks || "[]")
    : [];

  return (
    <div className="w-full lg:w-[350px] shrink-0 relative lg:sticky lg:top-24 z-10">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <UserAvatar src={user.image} name={user.name} className="w-24 h-24" />
            <h1 className="mt-4 text-2xl font-bold">{user.name ?? user.username}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
            {user.bio && (
              <div className="mt-2 w-full">
                <TruncatedLinkifiedText
                  text={user.bio}
                  limit={150}
                  className="text-sm text-foreground/90 leading-relaxed break-words"
                />
              </div>
            )}
            <div className="w-full mt-6">
              <div className="flex justify-between mb-4">
                <div>
                  <div className="font-semibold">{user._count.following.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{t("profile.header.following", "Following")}</div>
                </div>
                <Separator orientation="vertical" />
                <div>
                  <div className="font-semibold">{user._count.followers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{t("profile.header.followers", "Followers")}</div>
                </div>
                <Separator orientation="vertical" />
                <div>
                  <div className="font-semibold">{user._count.posts.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{t("profile.header.posts", "Posts")}</div>
                </div>
              </div>
            </div>

            {/* Atomic Client Micro-Leaf Action Buttons */}
            <ProfileActionButtons
              user={user}
              currentUserId={currentUserId}
              isAuthenticated={isAuthenticated}
              initialIsFollowing={initialIsFollowing}
            />

            <div className="w-full mt-6 space-y-3 text-sm text-left">
              {user.location && (
                <div className="flex items-center text-muted-foreground">
                  <MapPinIcon className="size-4 mr-2 shrink-0" />
                  <span className="truncate">{user.location}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center text-muted-foreground w-full min-w-0">
                  <LinkIcon className="size-4 mr-2 shrink-0" />
                  <a
                    href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                    className="hover:underline truncate min-w-0 flex-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {user.website}
                  </a>
                </div>
              )}
              <div className="flex items-center text-muted-foreground">
                <CalendarIcon className="size-4 mr-2 shrink-0" />
                {t("profile.header.joined", "Joined")} {formattedDate}
              </div>

              {/* Tech Stack Display */}
              {techStackList.length > 0 && (
                <div className="pt-3 border-t border-border/60 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("profile.header.techStack", "Tech Stack")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {techStackList.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[11px] rounded-md bg-primary/10 text-primary border border-primary/20 font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Developer Links Display */}
              {devLinks.length > 0 && (
                <div className="pt-3 border-t border-border/60 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("profile.header.developerLinks", "Developer Links")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {devLinks.map((link, idx) => {
                      const safeUrl = link.url.startsWith("http") ? link.url : `https://${link.url}`;
                      return (
                        <a
                          key={idx}
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors font-medium border border-border/50"
                        >
                          <LinkIcon className="size-3 text-primary" />
                          <span className="capitalize">{link.label || link.type}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Badges & Recognitions Display */}
              <DeveloperBadgeList
                solutionsCount={user.solutionsCount || 0}
                isStaffOrAdmin={user.role === "ADMIN"}
                hasMilestones={hasMilestones}
                techStackCount={techStackList.length}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
