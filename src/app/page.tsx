import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatPost from "@/components/CreatPost";
import FeedSwitcher from "@/components/FeedSwitcher";
import WhoToFollow from "@/components/WhoToFollow";
import { currentUser } from "@clerk/nextjs/server";






export default async function Home() {
  const user = await currentUser()
  const posts = await getPosts(); //1-  we will create getPosts action in [post.action.ts] + 2-  create PostCard under components
  const dbUserId = await getDbUserId(); //to provide the current user id to each single post component
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {user ? <CreatPost/> : null}
        {/* get posts 1st */}
        {/* Feed Switcher (Linear vs Masonry) */}
        <FeedSwitcher posts={posts} dbUserId={dbUserId} />
      </div>
      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        <WhoToFollow/>
      </div>
    </div>
  );
}
