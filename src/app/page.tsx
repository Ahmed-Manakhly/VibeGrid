import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatPost from "@/components/CreatPost";
import WhoToFollow from "@/components/WhoToFollow";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { MobileTabsLayout } from "@/components/MobileTabsLayout";
import { getCurrentSession } from "@/lib/auth/server";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { CategoryPills } from "@/components/CategoryPills";
import { Suspense } from "react";
import Loading from "./loading";

async function HomeFeed({ params, dbUserId }: { params: any, dbUserId: string | null }) {
  const result = await getPosts({
    category: params?.category,
    limit: 12
  });

  return (
    <div className="mt-4 flex flex-col gap-6">
      <InfiniteScroll 
        initialPosts={result.data} 
        initialNextCursor={result.nextCursor}
        apiUrl="/api/posts"
        dbUserId={dbUserId}
      />
    </div>
  );
}

interface PageProps {
  searchParams: {
    category?: string;
  };
}

export default async function Home({ searchParams }: PageProps) {
  const session = await getCurrentSession();
  const dbUserId = await getDbUserId(); 
  
  const params = await searchParams;
  const suspenseKey = JSON.stringify(params);

  return (
      <MobileTabsLayout
        feed={
          <>
            <div className="mb-8 hidden xl:block">
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                <p className="eyebrow eyebrow-live">LIVE COMMUNITY</p>
              </div>
              <h1 className="text-3xl font-bold font-sans">Your feed</h1>
            </div>
            

            <div className="mt-4 flex flex-col gap-6">
               {session.isAuthenticated ? <CreatPost/> : null}
            </div>

            <Suspense key={suspenseKey} fallback={<Loading />}>
               <HomeFeed params={params} dbUserId={dbUserId} />
            </Suspense>
          </>
        }
        discovery={
          <div className="flex flex-col gap-6 xl:sticky xl:top-[88px] xl:max-h-[calc(100vh-88px)] xl:overflow-y-auto z-10 pb-10 px-4 -mx-4 scrollbar-hide">
              <CategoryPills />
              <TrendingSidebar />
              <WhoToFollow/>
          </div>
        }
      />
  );
}

