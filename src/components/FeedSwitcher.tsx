"use client";

import { useState } from "react";
import PostCard from "./PostCard";
import { LayoutGrid, List } from "lucide-react";

export default function FeedSwitcher({ posts, dbUserId }: { posts: any[], dbUserId: string | null }) {
    const [mode, setMode] = useState<"linear" | "masonry">("linear");

    return (
        <div>
            <div className="flex justify-end mb-4 border-b border-border pb-2">
                <div className="flex space-x-2 bg-muted p-1 rounded-md">
                    <button 
                        onClick={() => setMode("linear")}
                        className={`p-2 rounded-md flex items-center transition-colors ${mode === "linear" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        title="Linear Thread View"
                    >
                        <List className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Thread</span>
                    </button>
                    <button 
                        onClick={() => setMode("masonry")}
                        className={`p-2 rounded-md flex items-center transition-colors ${mode === "masonry" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        title="Masonry Grid View"
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Grid</span>
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
