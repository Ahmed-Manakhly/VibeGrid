import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatPost from "@/components/CreatPost";
import FeedSwitcher from "@/components/FeedSwitcher";
import WhoToFollow from "@/components/WhoToFollow";
import ProfileWidget from "@/components/ProfileWidget";
import { TrendingSidebar } from "@/components/TrendingSidebar";
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
          <div className="mb-10">
            <div className="max-w-xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                <span className="text-primary/70">⫽</span> TUNED IN
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,240,255,0.1)]">Your daily pulse.</h1>
              <p className="text-accent text-sm sm:text-base font-medium">
                A signal-rich space for ideas, visual culture, and the people making what is next.
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col gap-6">
             {user ? <CreatPost/> : null}
             <FeedSwitcher posts={posts} dbUserId={dbUserId} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-6 xl:sticky xl:top-24 h-fit z-10">
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full bg-transparent border border-primary px-4 py-1.5 text-sm font-medium text-primary shadow-[0_0_15px_hsl(var(--primary)/0.4),inset_0_0_10px_hsl(var(--primary)/0.2)] whitespace-nowrap transition-all duration-300">Everything</button>
              <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent hover:shadow-[0_0_15px_hsl(var(--accent)/0.4),inset_0_0_10px_hsl(var(--accent)/0.2)] whitespace-nowrap transition-all duration-300">Design</button>
              <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent hover:shadow-[0_0_15px_hsl(var(--accent)/0.4),inset_0_0_10px_hsl(var(--accent)/0.2)] whitespace-nowrap transition-all duration-300">Tech</button>
              <button className="rounded-full bg-transparent border border-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent hover:shadow-[0_0_15px_hsl(var(--accent)/0.4),inset_0_0_10px_hsl(var(--accent)/0.2)] whitespace-nowrap transition-all duration-300">Culture</button>
            </div>
            
            <ProfileWidget />
            <TrendingSidebar />
            <WhoToFollow/>
        </div>
      </div>
  );
}
