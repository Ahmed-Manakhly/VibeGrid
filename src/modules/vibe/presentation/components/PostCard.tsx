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
import { PostInteractiveContainer } from './PostInteractiveContainer';
import { ProjectShipCard } from './ProjectShipCard';
import { PostGitHubUnfold } from '@/modules/github/presentation/components/PostGitHubUnfold';
import { TechDilemmaPollCard } from './TechDilemmaPollCard';

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
};

interface PostCardProps {
  post: post;
  dbUserId: string | null;
  isTruncated?: boolean;
  isDetailPage?: boolean;
}

/**
 * Clean Server Shell Component - Renders full Post layout on the Server without 'use client'
 */
export function PostCard({
  post,
  dbUserId,
  isTruncated = false,
  isDetailPage = false,
}: PostCardProps) {
  const structuredContent = PostContentValueObject.parse(post.content);
  const contentText = structuredContent.text;
  const contentLimit = 150;
  const shouldTruncate = !isDetailPage && contentText && contentText.length > contentLimit;
  const displayContent =
    shouldTruncate && contentText ? contentText.slice(0, contentLimit) + '...' : contentText;

  const hasLiked = post.likes?.some((like) => like.userId === dbUserId) || false;
  const initialLikes = post._count?.likes || 0;

  const hasBookmarked = post.bookmarks?.some((b) => b.userId === dbUserId) || false;
  const initialBookmarks = post._count?.bookmarks || (post.bookmarks?.length || 0);

  const hasReGridded = post.regrids?.some((r) => r.userId === dbUserId) || false;
  const initialReGrids = post._count?.regrids || (post.regrids?.length || 0);

  return (
    <article className="feed-card overflow-hidden pb-3 sm:pb-5">
      <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Link href={`/profile/${post.author.username}`} className="shrink-0">
              <UserAvatar src={post.author.image} name={post.author.name} className="size-8 transition-all" />
            </Link>
            <div className="flex flex-col min-w-0 flex-1">
              <Link href={`/profile/${post.author.username}`} className="font-semibold text-[13px] sm:text-sm truncate">
                {post.author.name}
              </Link>
              <div className="flex items-center space-x-1 sm:space-x-2 text-[11px] sm:text-xs text-muted-foreground truncate min-w-0">
                <Link href={`/profile/${post.author.username}`} className="truncate">
                  @{post.author.username}
                </Link>
                <span className="shrink-0">•</span>
                {isDetailPage ? (
                  <>
                    <span className="shrink-0 hidden sm:inline" suppressHydrationWarning>
                      {formatDistanceToNow(new Date(post.createdAt))} ago
                    </span>
                    <span className="shrink-0 sm:hidden" suppressHydrationWarning>
                      {formatRelativeTime(new Date(post.createdAt))}
                    </span>
                  </>
                ) : (
                  <Link href={`/vibes/${post.id}`} className="hover:underline flex items-center space-x-1 sm:space-x-2">
                    <span className="shrink-0 hidden sm:inline" suppressHydrationWarning>
                      {formatDistanceToNow(new Date(post.createdAt))} ago
                    </span>
                    <span className="shrink-0 sm:hidden" suppressHydrationWarning>
                      {formatRelativeTime(new Date(post.createdAt))}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
          {dbUserId === post.author.id && (
            <div className="shrink-0">
              <PostDeleteAction postId={post.id} />
            </div>
          )}
        </div>

        {post.content && (
          <div className="space-y-3">
            {contentText &&
              (isDetailPage ? (
                <p className="text-[14px] sm:text-base text-foreground leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {displayContent}
                </p>
              ) : (
                <Link href={`/vibes/${post.id}`} className="block hover:opacity-80 transition-opacity">
                  <p className="text-[14px] sm:text-base text-foreground leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {displayContent}
                  </p>
                </Link>
              ))}

            {structuredContent.codeBlock && (
              <CodeBlockViewer
                language={structuredContent.codeBlock.language}
                code={structuredContent.codeBlock.code}
              />
            )}

            {post.techContext && (post.postType === 'ship' || post.techContext.isShip) && (
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

            {post.poll && (
              <div className="pt-1">
                <TechDilemmaPollCard poll={post.poll} />
              </div>
            )}

            {contentText && <PostGitHubUnfold content={contentText} />}

            {shouldTruncate && (
              <Link
                href={`/vibes/${post.id}`}
                className="inline-flex items-center mt-2 text-sm font-medium text-primary hover:text-foreground transition-colors group"
              >
                <span className="group-hover:underline">Read more</span>
                <span className="ml-1 transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {!isTruncated && post.mediaUrl && (
        <PostMediaContainer mediaUrl={post.mediaUrl} mediaType={post.mediaType} />
      )}

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
          initialBookmarks={initialBookmarks}
          initialBookmarked={hasBookmarked}
          initialReGrids={initialReGrids}
          initialReGridded={hasReGridded}
          initialComments={post.comments || []}
          isTruncated={isTruncated}
          isDetailPage={isDetailPage}
        />
      </div>
    </article>
  );
}

export default PostCard;