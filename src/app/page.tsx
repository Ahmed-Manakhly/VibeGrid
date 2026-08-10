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
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                <p className="eyebrow eyebrow-live">LIVE COMMUNITY</p>
              </div>
              <h1 className="text-3xl font-bold font-sans">Your feed</h1>
            </div>
            
            <div className="mt-4 flex flex-col gap-6">
               {user ? <CreatPost/> : null}
               <FeedSwitcher posts={posts} dbUserId={dbUserId} />
            </div>
          </>
        }
        discovery={
          <div className="flex flex-col gap-6 xl:sticky xl:top-[88px] xl:max-h-[calc(100vh-88px)] xl:overflow-y-auto z-10 pb-10 px-4 -mx-4 scrollbar-hide">
              <div className="flex flex-wrap gap-2 pt-2">
                {['Everything', 'Design', 'Tech', 'Culture', 'Business', 'Productivity', 'Startups', 'Lifestyle'].map((tag, i) => (
                  <button 
                    key={tag} 
                    className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-300 border shadow-none ${
                      i === 0 
                        ? 'bg-primary/10 border-primary/50 text-primary -translate-y-1' 
                        : 'bg-card border-transparent text-muted-foreground hover:border-border hover:text-foreground hover:-translate-y-1'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              <TrendingSidebar />
              <WhoToFollow/>
          </div>
        }
      />
  );
}
