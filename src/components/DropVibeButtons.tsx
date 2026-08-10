"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export function DesktopDropVibeButton() {
    return (
        <Link 
            href="/#create-post" 
            onClick={() => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('focusCreatePost')); }} 
            className="btn-gradient hidden items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold sm:flex"
        >
            <Plus className="size-4" /> Drop Vibe
        </Link>
    );
}

export function MobileDropVibeButton() {
    return (
        <Link 
            href="/#create-post" 
            onClick={() => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('focusCreatePost')); }} 
            className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
            <div className="btn-gradient p-2 rounded-xl shadow-lg transition-colors">
                <Plus className="size-5" />
            </div>
        </Link>
    );
}
