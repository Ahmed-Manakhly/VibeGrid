import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import PostCard from "@/modules/vibe/presentation/components/PostCard";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

export async function RelatedPostsSidebar({ tags, currentPostId }: { tags: any[], currentPostId: string }) {
  if (!tags || tags.length === 0) return null;

  const firstTag = tags[0]?.tag?.slug;
  if (!firstTag) return null;

  // Fetch posts with the same tag
  const feed = await getPosts({ tag: firstTag, limit: 3 });
  const relatedPosts = feed.data.filter((p: any) => p.id !== currentPostId);
  const dbUserId = await getDbUserId();

  if (relatedPosts.length === 0) return null;

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50 sticky top-24">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>More in #{tags[0].tag.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        {relatedPosts.map((post: any) => (
          <PostCard key={post.id} post={post} dbUserId={dbUserId} isTruncated={true} />
        ))}
      </CardContent>
    </Card>
  );
}
