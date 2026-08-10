import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatPost from "@/components/CreatPost";
import FeedSwitcher from "@/components/FeedSwitcher";
import WhoToFollow from "@/components/WhoToFollow";
import ProfileWidget from "@/components/ProfileWidget";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { MobileTabsLayout } from "@/components/MobileTabsLayout";
import { currentUser } from "@clerk/nextjs/server";
import { Grid3X3, AlignJustify } from "lucide-react";

export default async function Home() {
  const user = await currentUser()
  const posts = await getPosts(); 
  const dbUserId = await getDbUserId(); 
  
  const topics = ['All Vibes', 'Design Engineering', 'AI Agents', 'Creative Coding', 'WebGL'];

  return (
      <MobileTabsLayout
        feed={
          <>
            <div className="mb-8 hidden xl:block">
              {/* Keeping spacing for alignment without the large text */}
            </div>
            
            <div className="mt-4 flex flex-col gap-6">
               {user ? <CreatPost/> : null}
               <FeedSwitcher posts={posts} dbUserId={dbUserId} />
            </div>
          </>
        }
        discovery={
          <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-6 xl:sticky xl:top-[88px] xl:max-h-[calc(100vh-88px)] xl:overflow-y-auto z-10 pb-10 scrollbar-hide">
              <div className="flex flex-wrap gap-2">
                <button className="rounded-full bg-transparent border border-primary px-4 py-1.5 text-sm font-medium text-primary shadow-[0_0_15px_hsl(var(--primary)/0.4),inset_0_0_10px_hsl(var(--primary)/0.2)] whitespace-nowrap transition-all duration-300">Everything</button>
                <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent hover:shadow-[0_0_15px_hsl(var(--accent)/0.4),inset_0_0_10px_hsl(var(--accent)/0.2)] whitespace-nowrap transition-all duration-300">Design</button>
                <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent hover:shadow-[0_0_15px_hsl(var(--accent)/0.4),inset_0_0_10px_hsl(var(--accent)/0.2)] whitespace-nowrap transition-all duration-300">Tech</button>
                <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent hover:shadow-[0_0_15px_hsl(var(--accent)/0.4),inset_0_0_10px_hsl(var(--accent)/0.2)] whitespace-nowrap transition-all duration-300">Culture</button>
              </div>
              
              <TrendingSidebar />
              <WhoToFollow/>
          </div>
        }
      />
  );
}
