export const dynamic = "force-dynamic";

import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatPost from "@/components/CreatPost";
import WhoToFollow from "@/components/WhoToFollow";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { MobileTabsLayout } from "@/components/MobileTabsLayout";
import { getCurrentSession } from "@/lib/auth/server";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { CategoryPills } from "@/components/CategoryPills";
import { TrendingShipsLeaderboard } from "@/modules/vibe/presentation/components/TrendingShipsLeaderboard";
import { PageHeader } from "@/components/PageHeader";
import { Radio } from "lucide-react";
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
  searchParams: Promise<{ category?: string }> | { category?: string };
}

export default async function Home({ searchParams }: PageProps) {
  const session = await getCurrentSession();
  const dbUserId = await getDbUserId(); 
  
  const params = await (searchParams as any);
  const suspenseKey = JSON.stringify(params || {});

  return (
      <MobileTabsLayout
        feed={
          <>
            <PageHeader
              eyebrow="LIVE COMMUNITY"
              title="Your feed"
              subtitle="Real-time developer pulses, ships, and tech discoveries from across the grid."
              icon={Radio}
              hideOnMobile={true}
            />
            

            <div className="mt-4 flex flex-col gap-6">
               {session.isAuthenticated ? <CreatPost/> : null}
            </div>

            <Suspense key={suspenseKey} fallback={<Loading />}>
               <HomeFeed params={params} dbUserId={dbUserId} />
            </Suspense>
          </>
        }
        discovery={
          <>
            <CategoryPills />
            <TrendingShipsLeaderboard limit={4} />
            <TrendingSidebar />
            <WhoToFollow />
          </>
        }
      />
  );
}

