export const dynamic = "force-dynamic";

import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { MobileTabsLayout } from "@/components/MobileTabsLayout";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { Suspense } from "react";
import Loading from "../loading";
import { BookmarkIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Bookmarks",
  description: "Saved developer vibes and code snippets",
  noIndex: true,
});

async function BookmarksFeed({ dbUserId }: { dbUserId: string }) {
  const result = await getPosts({
    bookmarkedByUserId: dbUserId,
    limit: 12,
  });

  if (result.data.length === 0) {
    return (
      <div className="text-center py-20 bg-card/40 rounded-2xl border border-border/50 p-8">
        <div className="flex justify-center mb-4 text-primary">
          <BookmarkIcon className="size-12 opacity-80" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No saved vibes yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
          Bookmark vibes while browsing to save them here for quick access anytime.
        </p>
        <Button asChild className="btn-gradient">
          <Link href="/explore">Explore Vibes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-6">
      <InfiniteScroll
        initialPosts={result.data}
        initialNextCursor={result.nextCursor}
        apiUrl="/api/posts"
        dbUserId={dbUserId}
        mode="infinite"
      />
    </div>
  );
}

export default async function BookmarksPage() {
  const dbUserId = await getDbUserId();

  if (!dbUserId) {
    return (
      <div className="text-center py-20 bg-card/40 rounded-2xl border border-border/50 p-8 max-w-md mx-auto mt-12">
        <BookmarkIcon className="size-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Saved Vibes</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Log in to access your saved posts and bookmarks across all your devices.
        </p>
        <Button asChild className="btn-gradient">
          <Link href="/login">Log In to View Bookmarks</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="SAVED VIBES"
        title="Bookmarks"
        subtitle="Your curated collection of saved vibes, code snippets, and discussions."
        icon={BookmarkIcon}
      />
      <MobileTabsLayout
        feed={
          <Suspense fallback={<Loading />}>
            <BookmarksFeed dbUserId={dbUserId} />
          </Suspense>
        }
        discovery={<TrendingSidebar />}
      />
    </>
  );
}
