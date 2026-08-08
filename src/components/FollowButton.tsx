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
            variant={"secondary"}
            onClick={handleFollow}
            disabled={isLoading}
            className="w-20 rounded-full font-mono text-xs bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 hover:border-secondary/50 hover:shadow-[0_0_10px_rgba(255,36,228,0.3)] transition-all duration-300"
        >
            {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : "Tune In"}
        </Button>
    );
}
export default FollowButton;