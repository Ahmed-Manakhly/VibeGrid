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
        <div className="flex-1 max-w-2xl w-full mx-auto xl:mx-0">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold tracking-tight">The Grid</h1>
            <div className="view-switcher hidden sm:flex">
              <button className="view-switch-active"><Grid3X3 /> Grid</button>
              <button><AlignJustify /> List</button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            {topics.map(topic => (
              <button key={topic} className={`topic-pill ${topic === 'All Vibes' ? 'topic-pill-active' : ''}`}>{topic}</button>
            ))}
          </div>
          
          <div className="mt-4 flex flex-col gap-6">
             {user ? <CreatPost/> : null}
             <FeedSwitcher posts={posts} dbUserId={dbUserId} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-80 shrink-0 flex flex-col gap-6">
            <ProfileWidget />
            <TrendingSidebar />
            <WhoToFollow/>
        </div>
      </div>
  );
}
