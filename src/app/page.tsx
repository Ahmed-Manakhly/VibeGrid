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
      <div className="flex flex-col gap-10 xl:flex-row xl:items-start">
        {/* Main Feed */}
        <div className="flex-1 min-w-0 mx-auto xl:mx-0">
          <div className="mb-8 hidden xl:block">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-primary animate-pulse"></span>
              <p className="eyebrow">LIVE COMMUNITY</p>
            </div>
            <h1 className="text-3xl font-bold font-sans">Your feed</h1>
          </div>
          
          <div className="mt-4 flex flex-col gap-6">
             {user ? <CreatPost/> : null}
             <FeedSwitcher posts={posts} dbUserId={dbUserId} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-6 xl:sticky xl:top-[88px] xl:max-h-[calc(100vh-88px)] xl:overflow-y-auto z-10 pb-10 scrollbar-hide">
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full bg-transparent border border-primary px-4 py-1.5 text-sm font-medium text-primary whitespace-nowrap transition-all duration-300">Everything</button>
              <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent whitespace-nowrap transition-all duration-300">Design</button>
              <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent whitespace-nowrap transition-all duration-300">Tech</button>
              <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent whitespace-nowrap transition-all duration-300">Culture</button>
              <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent whitespace-nowrap transition-all duration-300">Business</button>
              <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent whitespace-nowrap transition-all duration-300">Productivity</button>
              <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent whitespace-nowrap transition-all duration-300">Startups</button>
              <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent whitespace-nowrap transition-all duration-300">Lifestyle</button>
            </div>
            
            <TrendingSidebar />
            <WhoToFollow/>
        </div>
      </div>
  );
}
