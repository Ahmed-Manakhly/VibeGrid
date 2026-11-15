import { getRandomUsers } from "@/actions/user.action";
import { WhoToFollowClient } from "./WhoToFollowClient";

export default async function WhoToFollow() {
  const users = await getRandomUsers();
  if (users.length === 0) return null;

  return <WhoToFollowClient initialUsers={users} />;
}
