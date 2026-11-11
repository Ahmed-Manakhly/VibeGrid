import Link from 'next/link';
import { UserAvatar } from '@/components/UserAvatar';
import { formatRelativeTime } from '@/lib/utils';
import { PostContentValueObject } from '@/modules/vibe/domain/PostContentValueObject';
import { Code2, ImageIcon, Rocket } from 'lucide-react';

interface EmbeddedQuotedPostCardProps {
  post: {
    id: string;
    content: string | null;
    mediaUrl?: string | null;
    postType?: string | null;
    createdAt: Date | string;
    author: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
    tags?: any[];
  };
}

export function EmbeddedQuotedPostCard({ post }: EmbeddedQuotedPostCardProps) {
  if (!post) return null;

  const structuredContent = PostContentValueObject.parse(post.content);
  const text = structuredContent.text || '';
  const hasCode = !!structuredContent.codeBlock?.code;
  const createdAtDate = typeof post.createdAt === 'string' ? new Date(post.createdAt) : post.createdAt;

  return (
    <Link
      href={`/vibes/${post.id}`}
      className="block mt-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-all p-3 sm:p-3.5 space-y-2 group"
    >
      {/* Header: Author Info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <UserAvatar
            src={post.author.image}
            name={post.author.name}
            className="size-5 shrink-0"
          />
          <div className="flex items-center gap-1.5 min-w-0 text-xs">
            <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {post.author.name || post.author.username}
            </span>
            <span className="text-muted-foreground truncate">
              @{post.author.username}
            </span>
            <span className="text-muted-foreground text-[10px]">·</span>
            <span className="text-muted-foreground text-[11px] font-mono shrink-0">
              {formatRelativeTime(createdAtDate)}
            </span>
          </div>
        </div>

        {/* Post Type Badge */}
        {post.postType === 'PROJECT_SHIP' && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shrink-0">
            <Rocket className="size-3" /> Ship
          </span>
        )}
      </div>

      {/* Snippet Content */}
      {text && (
        <p className="text-xs text-foreground/90 leading-relaxed line-clamp-3">
          {text}
        </p>
      )}

      {/* Media or Code indicators */}
      <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground font-mono">
        {hasCode && (
          <span className="inline-flex items-center gap-1 text-primary">
            <Code2 className="size-3.5" /> Code attached
          </span>
        )}
        {post.mediaUrl && (
          <span className="inline-flex items-center gap-1 text-accent">
            <ImageIcon className="size-3.5" /> Media attached
          </span>
        )}
      </div>
    </Link>
  );
}
