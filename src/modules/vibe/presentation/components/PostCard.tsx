import Link from 'next/link';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { formatRelativeTime } from '@/lib/utils';
import { getPosts } from '@/actions/post.action';
import { PostMediaContainer } from './PostMediaContainer';
import { PostContentValueObject } from '@/modules/vibe/domain/PostContentValueObject';
import { CodeBlockViewer } from './CodeBlockViewer';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PostDeleteAction } from './PostDeleteAction';
import { PostSafetyMenu } from './PostSafetyMenu';
import { PostInteractiveContainer } from './PostInteractiveContainer';
import { ProjectShipCard } from './ProjectShipCard';
import { PostGitHubUnfold } from '@/modules/github/presentation/components/PostGitHubUnfold';
import { TechDilemmaPollCard } from './TechDilemmaPollCard';
import { EmbeddedQuotedPostCard } from '@/components/EmbeddedQuotedPostCard';
import { RepeatIcon } from 'lucide-react';
import { FollowButton } from '@/modules/social/presentation/components/FollowButton';
import { PostExpandableText } from './PostExpandableText';
import { PostLinkPreview } from './PostLinkPreview';
import { PostCardHeaderSlot } from './PostCardHeaderSlot';

type FeedResponse = Awaited<ReturnType<typeof getPosts>>;
type post = FeedResponse['data'][number] & {
  category?: any;
  vibe?: any;
  tags?: any[];
  mediaUrl?: string | null;
  mediaType?: any;
  bookmarks?: any[];
  regrids?: any[];
  techContext?: any;
  postType?: string;
  poll?: any;
  quotedPost?: any;
};

interface PostCardProps {
  post: post;
  dbUserId: string | null;
  isTruncated?: boolean;
  isDetailPage?: boolean;
  canModerate?: boolean;
}

/**
 * Clean Server Shell Component - Renders full Post layout on the Server without 'use client'
 */
export function PostCard({
  post,
  dbUserId,
  isTruncated = false,
  isDetailPage = false,
  canModerate = false,
}: PostCardProps) {
  const structuredContent = PostContentValueObject.parse(post.content);
  const contentText = structuredContent.text;

  const hasLiked = post.likes?.some((like) => like.userId === dbUserId) || false;
  const initialLikes = post._count?.likes || 0;

  const hasBookmarked = post.bookmarks?.some((b) => b.userId === dbUserId) || false;
  const initialBookmarks = post._count?.bookmarks || (post.bookmarks?.length || 0);

  const hasReGridded = post.regrids?.some((r) => r.userId === dbUserId) || false;
  const initialReGrids = post._count?.regrids || (post.regrids?.length || 0);
  const initialCommentsCount = post.comments ? post.comments.filter((c: any) => !c.parentId).length : (post._count?.comments || 0);

  // Check if this card represents a regridded post in the feed
  const firstReposter = post.regrids && post.regrids.length > 0 ? post.regrids[0].user : null;

  return (
    <article className="feed-card overflow-hidden pb-3 sm:pb-5">
      {firstReposter && (
        <div className="px-3 sm:px-5 pt-2.5 pb-1 flex items-center gap-1.5 text-xs text-muted-foreground border-b border-border/30 bg-muted/20">
          <RepeatIcon className="size-3 text-green-500 shrink-0" />
          <span className="font-mono text-[11px]">Re-gridded by</span>
          <Link
            href={`/profile/${firstReposter.username || firstReposter.id}`}
            className="font-semibold text-foreground hover:underline truncate"
          >
            {firstReposter.name || firstReposter.username || 'Developer'}
          </Link>
        </div>
      )}
      {post.community && (
        <div className="bg-primary/5 px-3 sm:px-5 py-1.5 border-b border-border/30 text-[11px] sm:text-xs text-muted-foreground flex items-center justify-between">
          <Link 
            href={`/communities/${post.community.slug}`} 
            className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors group"
          >
            <span className="size-2 rounded-full bg-primary shrink-0" />
            <span className="text-muted-foreground">in</span>
            <span className="font-semibold group-hover:underline">{post.community.name}</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
            Guild
          </span>
        </div>
      )}
      <PostCardHeaderSlot postId={post.id} isDetailPage={isDetailPage} className="p-3 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Link href={`/profile/${post.author.username}`} className="shrink-0">
              <UserAvatar src={post.author.image} name={post.author.name} className="size-9 transition-all" />
            </Link>
            <div className="flex flex-col min-w-0 flex-1">
              <Link href={`/profile/${post.author.username}`} className="font-semibold text-[13px] sm:text-sm truncate hover:underline">
                {post.author.name}
              </Link>
              <Link href={`/profile/${post.author.username}`} className="text-[11px] sm:text-xs text-muted-foreground truncate hover:underline">
                @{post.author.username}
              </Link>
              <div className="text-[10px] text-muted-foreground/80 pt-0.5" suppressHydrationWarning>
                {isDetailPage ? (
                  formatDistanceToNow(new Date(post.createdAt)) + ' ago'
                ) : (
                  <Link href={`/explore/${post.id}`} className="hover:underline">
                    {formatDistanceToNow(new Date(post.createdAt))} ago
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right Header Actions: Stacked vertically with 3-dots on top, and Tune In / Delete button directly underneath */}
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              {canModerate && dbUserId !== post.author.id && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 hidden sm:inline">
                  Mod
                </span>
              )}

              <PostSafetyMenu
                postId={post.id}
                authorId={post.author.id}
                authorUsername={post.author.username || ''}
                initialBookmarked={hasBookmarked}
              />
            </div>

            {dbUserId && dbUserId !== post.author.id && (
              <FollowButton
                targetUserId={post.author.id}
                initialIsFollowing={Boolean((post.author as any)?.isFollowing)}
                className="h-6 px-2 text-[10px] sm:text-[11px] rounded-lg shadow-sm"
              />
            )}

            {dbUserId === post.author.id && (
              <PostDeleteAction postId={post.id} />
            )}
          </div>
        </div>

        {(contentText || post.poll || post.techContext || structuredContent.codeBlock) && (
          <div className="space-y-3">
            {/* 1. Text Content */}
            {contentText ? (
              isDetailPage ? (
                <PostExpandableText content={contentText} showExpandToggle={false} />
              ) : (
                <PostExpandableText content={contentText} limit={200} />
              )
            ) : null}

            {/* 2. Code Block */}
            {structuredContent.codeBlock && (
              <CodeBlockViewer
                language={structuredContent.codeBlock.language}
                code={structuredContent.codeBlock.code}
              />
            )}

            {/* 3. Media (Placed after Code and before Shipped Project / Poll per contract) */}
            {!isTruncated && post.mediaUrl && (
              <div className="pt-1">
                <PostMediaContainer mediaUrl={post.mediaUrl} mediaType={post.mediaType} />
              </div>
            )}

            {/* 4. Shipped Project */}
            {post.techContext && (post.postType === 'PROJECT_SHIP' || post.postType === 'ship' || post.techContext.isShip) && (
              <div className="pt-1">
                <ProjectShipCard
                  projectName={post.techContext.projectName}
                  tagline={post.techContext.tagline}
                  demoUrl={post.techContext.demoUrl}
                  repoUrl={post.techContext.repoUrl}
                  techStack={post.techContext.techStack}
                />
              </div>
            )}

            {/* 5. Dilemma Poll */}
            {post.poll && (
              <div className="pt-1">
                <TechDilemmaPollCard poll={post.poll} />
              </div>
            )}

            {/* Rich previews: GitHub cards and external link OpenGraph previews */}
            {contentText && (
              <>
                <PostGitHubUnfold content={contentText} />
                <PostLinkPreview content={contentText} />
              </>
            )}

            {/* Embedded Quoted Post (Quote Vibe) */}
            {post.quotedPost && (
              <EmbeddedQuotedPostCard post={post.quotedPost} />
            )}
          </div>
        )}
      </PostCardHeaderSlot>

      <div className="px-3 sm:px-5 mt-3 sm:mt-4 space-y-3 sm:space-y-4">
        {(post.category || post.vibe || (post.tags && post.tags.length > 0)) && (
          <div className="flex flex-wrap gap-2 pt-1 sm:pt-2">
            {post.category && (
              <Link
                href={`/explore?category=${post.category.slug}`}
                className="px-3 py-1 text-[11px] rounded-full bg-primary/10 text-primary font-medium tracking-wide border-none hover:bg-primary/20 transition-colors"
              >
                {post.category.emoji} {post.category.name}
              </Link>
            )}
            {post.vibe && (
              <Link
                href={`/explore?vibe=${post.vibe.key}`}
                className="px-3 py-1 text-[11px] rounded-full bg-background border border-transparent text-muted-foreground hover:text-foreground hover:border-border transition-colors font-medium tracking-wide"
              >
                {post.vibe.label}
              </Link>
            )}
            {post.tags &&
              post.tags.slice(0, 4).map((postTag: any, idx: number) => (
                <Link
                  href={`/explore?tag=${postTag.tag.slug}`}
                  key={idx}
                  className="px-2.5 py-1 text-[10px] rounded-full bg-transparent border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors font-medium italic tracking-wide"
                >
                  #{postTag.tag.name}
                </Link>
              ))}
            {post.tags && post.tags.length > 4 && (
              <Dialog>
                <DialogTrigger asChild>
                  <button className="px-2.5 py-1 text-[10px] rounded-full bg-transparent border border-border/30 text-muted-foreground/70 hover:text-foreground hover:border-border transition-colors font-medium tracking-wide">
                    +{post.tags.length - 4}
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-background border-border">
                  <DialogHeader>
                    <DialogTitle>All Tags</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-wrap gap-2 pt-4">
                    {post.tags.map((postTag: any, idx: number) => (
                      <Link
                        href={`/explore?tag=${postTag.tag.slug}`}
                        key={idx}
                        className="px-3 py-1.5 text-sm rounded-full bg-transparent border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors font-medium tracking-wide"
                      >
                        #{postTag.tag.name}
                      </Link>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        <PostInteractiveContainer
          postId={post.id}
          postAuthorId={post.author.id}
          dbUserId={dbUserId}
          initialLikes={initialLikes}
          initialLiked={hasLiked}
          likesList={post.likes || []}
          initialReGrids={initialReGrids}
          initialReGridded={hasReGridded}
          initialComments={post.comments || []}
          initialCommentsCount={initialCommentsCount}
          isTruncated={isTruncated}
          isDetailPage={isDetailPage}
          communityId={post.communityId}
          isCommunityMember={
            Boolean(
              dbUserId &&
              post.community?.members?.some((m: any) => m.userId === dbUserId)
            )
          }
          targetPostData={{
            id: post.id,
            content: post.content,
            mediaUrl: post.mediaUrl,
            postType: post.postType,
            createdAt: post.createdAt,
            author: post.author,
          }}
        />
      </div>
    </article>
  );
}

export default PostCard;