export const dynamic = "force-dynamic";

import { getPostById } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import PostCard from "@/components/PostCard";
import { notFound } from "next/navigation";
import { MobileTabsLayout } from "@/components/MobileTabsLayout";
import { RelatedPostsSidebar } from "@/components/RelatedPostsSidebar";
import { BackButton } from "@/components/BackButton";

export async function generateMetadata({ params }: { params: any }) {
  const resolvedParams = await params;
  const post = await getPostById(resolvedParams.id);
  if (!post) return { title: "Post Not Found" };
  
  return {
    title: `${post.author.name} on VibeGrid`,
    description: post.content ? post.content.substring(0, 160) : "Check out this vibe",
  };
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

  return (
    <MobileTabsLayout
      feed={
        <div className="pt-4 max-w-2xl mx-auto w-full">
          <BackButton />
          <PostCard post={post} dbUserId={dbUserId} isDetailPage={true} />
        </div>
      }
      discovery={
        <div className="flex flex-col gap-6 xl:sticky xl:top-20 xl:h-[calc(100vh-80px)] xl:overflow-y-auto z-10 pb-10 px-4 -mx-4 scrollbar-hide">
          <RelatedPostsSidebar tags={post.tags} currentPostId={post.id} />
        </div>
      }
    />
  );
}
