export const dynamic = "force-dynamic";

import { getPosts } from "@/actions/post.action";
import { getDbUserId, searchUsers } from "@/actions/user.action";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { SearchInput } from "@/components/SearchInput";
import { ExploreFilters } from "@/components/ExploreFilters";
import { MobileTabsLayout } from "@/components/MobileTabsLayout";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { DeveloperSearchResults } from "@/components/DeveloperSearchResults";
import { Suspense } from "react";
import Loading from "../loading";

async function ExploreFeed({ params, dbUserId }: { params: any, dbUserId: string | null }) {
  const searchQuery = params?.q?.trim();

  // Parallel fetch: Developer profiles + Post search results
  const [developerResults, postResult] = await Promise.all([
    searchQuery ? searchUsers(searchQuery) : Promise.resolve([]),
    getPosts({
      search: searchQuery,
      category: params?.category,
      tag: params?.tag,
      vibe: params?.vibe,
      limit: 12,
    }),
  ]);

  return (
    <div className="mt-4 flex flex-col gap-6">
      {searchQuery && <DeveloperSearchResults users={developerResults} />}

      <InfiniteScroll
        initialPosts={postResult.data}
        initialNextCursor={postResult.nextCursor}
        apiUrl="/api/posts"
        dbUserId={dbUserId}
        mode="manual"
      />
    </div>
  );
}

interface ExploreProps {
  searchParams: {
    q?: string;
    category?: string;
    tag?: string;
    vibe?: string;
  };
}

export default async function ExplorePage({ searchParams }: ExploreProps) {
  const dbUserId = await getDbUserId();
  
  // Await searchParams in Next 15+
  const params = await searchParams;
  const suspenseKey = JSON.stringify(params);

  return (
    <MobileTabsLayout
      feed={
        <>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-primary animate-pulse"></span>
              <p className="eyebrow eyebrow-live">DISCOVER THE GRID</p>
            </div>
            <h1 className="text-3xl font-bold font-sans mb-6">Explore</h1>
            <SearchInput />
          </div>

          <Suspense key={suspenseKey} fallback={<Loading />}>
            <ExploreFeed params={params} dbUserId={dbUserId} />
          </Suspense>
        </>
      }
      discovery={
        <>
          <ExploreFilters />
          <div className="border-t border-white/10 my-4" />
          <TrendingSidebar />
        </>
      }
    />
  );
}
