import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { SearchInput } from "@/components/SearchInput";
import { ExploreFilters } from "@/components/ExploreFilters";
import { MobileTabsLayout } from "@/components/MobileTabsLayout";
import { TrendingSidebar } from "@/components/TrendingSidebar";

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

  const result = await getPosts({
    search: params?.q,
    category: params?.category,
    tag: params?.tag,
    vibe: params?.vibe,
    limit: 12,
  });

  return (
    <MobileTabsLayout
      feed={
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-sans mb-6">Explore</h1>
            <SearchInput />
          </div>

          <div className="mt-4 flex flex-col gap-6">
            <InfiniteScroll
              initialPosts={result.data}
              initialNextCursor={result.nextCursor}
              apiUrl="/api/posts"
              dbUserId={dbUserId}
            />
          </div>
        </>
      }
      discovery={
        <div className="flex flex-col gap-6 xl:sticky xl:top-[88px] xl:max-h-[calc(100vh-88px)] xl:overflow-y-auto z-10 pb-10 px-4 -mx-4 scrollbar-hide">
          <ExploreFilters />
          <div className="border-t border-white/10 my-4" />
          <TrendingSidebar />
        </div>
      }
    />
  );
}
