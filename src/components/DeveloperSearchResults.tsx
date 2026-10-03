import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";
import { UsersIcon, MapPinIcon, GlobeIcon } from "lucide-react";

export function DeveloperSearchResults({ users }: { users: any[] }) {
  if (!users || users.length === 0) return null;

  return (
    <div className="bg-card/50 rounded-2xl border border-border/60 p-5 space-y-4 shadow-sm mb-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <UsersIcon className="size-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider">
            Developers ({users.length})
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">Matching profiles</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {users.map((user) => {
          const displayName = user.name || user.username;
          return (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className="flex items-start gap-3 p-3 rounded-xl bg-background/60 hover:bg-muted/60 border border-border/30 transition-all hover:border-primary/40 group"
            >
              <UserAvatar src={user.image} name={displayName} className="size-10 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {displayName}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                {user.bio && (
                  <p className="text-xs text-muted-foreground/90 line-clamp-2 mt-1">
                    {user.bio}
                  </p>
                )}
                {(user.location || user._count) && (
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    {user.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPinIcon className="size-3 shrink-0" />
                        <span className="truncate">{user.location}</span>
                      </span>
                    )}
                    {user._count?.followers !== undefined && (
                      <span>{user._count.followers} followers</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
