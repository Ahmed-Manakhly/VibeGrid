"use client";

import { useState } from "react";
import PostCard from "./PostCard";
import { Grid3X3, AlignJustify } from "lucide-react";
export default function FeedSwitcher({ posts, dbUserId }: { posts: any[], dbUserId: string | null }) {
    const [mode, setMode] = useState<"linear" | "masonry">("masonry");

    return (
        <div>
            <div className="hidden sm:flex justify-start mb-6">
                <div className="view-switcher">
                    <button 
                        onClick={() => setMode("linear")}
                        className={mode === "linear" ? "btn-gradient shadow-none border-none" : "hover:text-primary"}
                        title="Linear Thread View"
                    >
                        <AlignJustify />
                        Thread
                    </button>
                    <button 
                        onClick={() => setMode("masonry")}
                        className={mode === "masonry" ? "btn-gradient shadow-none border-none" : "hover:text-primary"}
                        title="Masonry Grid View"
                    >
                        <Grid3X3 />
                        Grid
                    </button>
                </div>
            </div>

            {mode === "linear" ? (
                <div className="space-y-6">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} dbUserId={dbUserId} />
                    ))}
                </div>
            ) : (
                <div className="columns-1 md:columns-2 gap-4 space-y-4">
                    {posts.map(post => (
                        <div key={post.id} className="break-inside-avoid">
                            <PostCard post={post} dbUserId={dbUserId} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
