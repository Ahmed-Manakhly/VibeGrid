//this is the parent server component
// go to [user.action.ts], to create an action that fetches some users randomly

import { getRandomUsers } from "@/actions/user.action"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { UserAvatar } from "./UserAvatar";
import FollowButton from "./FollowButton";

async function WhoToFollow() {

  const users = await getRandomUsers() ;
  if(users.length === 0) return null ;

  return (
      <Card className="rounded-xl border bg-card/30 shadow-none">
        <CardHeader>
          <CardTitle className="font-mono tracking-widest text-muted-foreground uppercase text-sm">Who to Tune In To</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex gap-2 items-center justify-between ">
                <div className="flex items-center gap-1">
                  <Link href={`/profile/${user.username}`}>
                    <UserAvatar src={user.image} name={user.name} className="size-8 transition-all" />
                  </Link>
                  <div className="text-xs">
                    <Link href={`/profile/${user.username}`} className="font-medium cursor-pointer hover:underline">
                      {user.name}
                    </Link>
                    <p className="text-muted-foreground">@{user.username}</p>
                    {user.matchRationale && (
                      <span className="inline-block mt-0.5 text-[10px] font-medium text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                        {user.matchRationale}
                      </span>
                    )}
                  </div>
                </div>
                <FollowButton userId={user.id} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
  )
}

export default WhoToFollow