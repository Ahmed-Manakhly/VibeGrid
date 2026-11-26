export const dynamic = "force-dynamic";

import { getPostById } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import PostCard from "@/modules/vibe/presentation/components/PostCard";
import { notFound } from "next/navigation";
import { MobileTabsLayout } from "@/components/MobileTabsLayout";
import { RelatedPostsSidebar } from "@/components/RelatedPostsSidebar";
import { BackButton } from "@/components/BackButton";
import {
  generatePageMetadata,
  getPostStructuredData,
  getBreadcrumbStructuredData,
} from "@/lib/seo";

export async function generateMetadata({ params }: { params: any }) {
  const resolvedParams = await params;
  const post = await getPostById(resolvedParams.id);
  if (!post) {
    return generatePageMetadata({
      title: "Post Not Found",
      noIndex: true,
    });
  }

  const authorName = post.author?.name || post.author?.username || "Developer";
  const titleSnippet = post.content ? post.content.slice(0, 60).trim() : `Vibe by ${authorName}`;
  const description = post.content
    ? post.content.slice(0, 160).trim()
    : `Check out this vibe by @${post.author?.username} on VibeGrid.`;
  // 1st priority: post attached image, 2nd priority: author avatar, 3rd priority: default OG fallback
  const postImage = (post as any).mediaUrl || post.image || post.author?.image;

  return generatePageMetadata({
    title: `${authorName}: "${titleSnippet}"`,
    description,
    image: postImage,
    url: `/explore/${post.id}`,
    type: "article",
    authors: [authorName],
    publishedTime: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
    modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
  });
}

export default async function PostPage({ params }: { params: any }) {
  const dbUserId = await getDbUserId();
  
  // Resolve params for Next 15+ async params handling (if applicable, but safe pattern)
  const resolvedParams = await params;
  const postId = resolvedParams.id;
  const post = await getPostById(postId);

  if (!post) {
    notFound();
  }

  const postStructuredData = getPostStructuredData({
    id: post.id,
    content: post.content,
    authorName: post.author?.name,
    authorUsername: post.author?.username,
    authorAvatar: post.author?.image,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    image: (post as any).mediaUrl || post.image,
    likesCount: post._count?.likes,
    commentsCount: post._count?.comments,
  });

  const breadcrumbsStructuredData = getBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Explore", url: "/explore" },
    { name: post.content ? post.content.slice(0, 30) : "Vibe", url: `/explore/${post.id}` },
  ]);

  return (
    <>
      {postStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(postStructuredData) }}
        />
      )}
      {breadcrumbsStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsStructuredData) }}
        />
      )}
      <MobileTabsLayout
        showMobileTabs={true}
        feed={
          <div className="pt-4 max-w-2xl mx-auto w-full">
            <h1 className="sr-only">
              {post.content
                ? `${post.author?.name || post.author?.username || "Developer"}: ${post.content.slice(0, 80)}`
                : `Vibe by ${post.author?.name || post.author?.username || "Developer"}`}
            </h1>
            <BackButton />
            <PostCard post={post} dbUserId={dbUserId} isDetailPage={true} />
          </div>
        }
        discovery={<RelatedPostsSidebar tags={post.tags} currentPostId={post.id} />}
      />
    </>
  );
}
