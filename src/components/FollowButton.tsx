"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { toggleFollow } from "@/actions/user.action";

function FollowButton({ userId }: { userId: string }) { // userId is the target user not the current user
    const [isLoading, setIsLoading] = useState(false);
    const handleFollow = async () => {
        setIsLoading(true);
        try {
            await toggleFollow(userId); //go to [user.action.ts] to create this action 
            toast.success("User followed successfully");
        } catch (error) {
            toast.error("Error following user");
        } finally {
            setIsLoading(false);
        }
    };
    //--------------------
    return (
        <Button
            size={"sm"}
            onClick={handleFollow}
            disabled={isLoading}
            className="btn-gradient w-20 rounded-xl font-mono text-xs"
        >
            {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : "Tune In"}
        </Button>
    );
}
export default FollowButton;