"use client"
import { useSession } from "@/components/auth/SessionProvider";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
// ui imports
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageIcon, FilmIcon, Loader2Icon, SendIcon } from "lucide-react";
import { createPostFormAction } from "@/actions/post.action";
import toast from "react-hot-toast";
import ImageUpload from "@/components/ImageUpload";
import { UserAvatar } from "@/components/UserAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();

    return (
        <Button 
            type="submit"
            className="btn-gradient flex items-center rounded-xl" 
            disabled={disabled || pending}
        >
            {pending ? (
                <>
                    <Loader2Icon className="size-4 mr-2 animate-spin" />
                    Dropping...
                </>
            ) : (
                <>
                    <SendIcon className="size-4 mr-2" />
                    Drop Vibe
                </>
            )}
        </Button>
    );
}

function getDisplayInitial(user: any) {
    if (!user) return "U";
    const displayName = user.name || user.email?.split('@')[0] || "User";
    return displayName.charAt(0).toUpperCase();
}

export default function CreatPost() {
    const { user } = useSession();
    const initialLetter = getDisplayInitial(user);
    const displayName = user?.name || user?.email?.split('@')[0] || "You";
    
    // UI state only (not form data)
    const [imageUrl, setImageUrl] = useState("");
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Temporary state to conditionally disable button if empty, 
    // even though the form handles the actual data submission natively.
    const [contentVal, setContentVal] = useState("");

    const [categories, setCategories] = useState<any[]>([]);
    const [vibes, setVibes] = useState<any[]>([]);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Form Action Hook
    const [state, formAction] = useFormState(createPostFormAction, null);

    useEffect(() => {
        if (state?.success) {
            toast.success('Vibe has been dropped successfully!');
            formRef.current?.reset();
            setContentVal("");
            setImageUrl("");
            setShowImageUpload(false);
            setIsExpanded(false);
            window.dispatchEvent(new CustomEvent('refreshTrending'));
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state]);

    useEffect(() => {
        fetch("/api/feed/filters")
            .then((res) => res.json())
            .then((data) => {
                if (data.categories) setCategories(data.categories);
                if (data.vibes) setVibes(data.vibes);
            })
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        const handleFocus = () => {
            setIsExpanded(true);
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
        };

        window.addEventListener('focusCreatePost', handleFocus);
        return () => window.removeEventListener('focusCreatePost', handleFocus);
    }, []);

    const handleCancel = () => {
        setIsExpanded(false);
        setShowImageUpload(false);
        setContentVal('');
        setImageUrl('');
        formRef.current?.reset();
    };

    const profileHref = user ? `/profile/${user.name ? user.name.toLowerCase().replace(/\s+/g, '_') : user.email.split('@')[0]}` : '/login';

    return (
        <Card id="create-post" className="mb-6 feed-card scroll-mt-24">
            <CardContent className="pt-6 ">
                <form action={formAction} ref={formRef} className="space-y-4">
                    {!isExpanded ? (
                        <div className="flex items-center space-x-4 cursor-text" onClick={() => setIsExpanded(true)}>
                            <Link href={profileHref} onClick={(e) => e.stopPropagation()} className="hover:opacity-80 transition-opacity">
                                <UserAvatar src={user?.image} name={displayName} className="w-10 h-10" />
                            </Link>
                            <div className="flex-1 rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm text-muted-foreground hover:bg-background/80 transition-colors">
                                Drop a vibe...
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:space-x-4">
                                <div className="flex items-center gap-2 sm:block">
                                    <Link href={profileHref} className="hover:opacity-80 transition-opacity">
                                        <UserAvatar src={user?.image} name={displayName} className="w-8 h-8 sm:w-10 sm:h-10" />
                                    </Link>
                                    <span className="text-sm font-semibold sm:hidden">{displayName}</span>
                                </div>
                                <Textarea 
                                    name="content"
                                    placeholder="What's on your mind?" 
                                    value={contentVal} 
                                    onChange={(e) => setContentVal(e.target.value)}
                                    ref={textareaRef}
                                    className="min-h-[100px] flex-1 w-full resize-none border border-border/50 rounded-xl focus-visible:ring-1 focus-visible:ring-border bg-background p-3 text-base"
                                    autoFocus
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-2 pb-2">
                                <Select name="categoryId">
                                    <SelectTrigger className="w-full sm:w-[140px] h-10 sm:h-8 text-sm bg-background text-muted-foreground border-border/50 hover:border-primary/50 transition-all font-mono rounded-xl">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border/50 font-mono">
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.emoji} {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select name="vibeId">
                                    <SelectTrigger className="w-full sm:w-[140px] h-10 sm:h-8 text-sm bg-background text-muted-foreground border-border/50 hover:border-primary/50 transition-all font-mono rounded-xl">
                                        <SelectValue placeholder="Vibe" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border/50 font-mono">
                                        {vibes.map((v) => (
                                            <SelectItem key={v.id} value={v.id}>
                                                {v.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    name="tags"
                                    type="text"
                                    placeholder="Tags (comma separated, e.g. React, UI)"
                                    className="w-full sm:w-auto h-10 sm:h-8 text-sm bg-background text-muted-foreground border-border/50 focus-visible:border-border focus-visible:ring-1 focus-visible:ring-border flex-1 min-w-0 font-mono rounded-xl transition-all"
                                />
                            </div>
                            
                            {(showImageUpload || imageUrl) && (
                                <div className="border rounded-lg p-4">
                                    <ImageUpload endpoint="postImage" value={imageUrl} onChange={(url) => { setImageUrl(url); if (!url) setShowImageUpload(false); }} />
                                </div>
                            )}
                            
                            {/* Hidden input for imageUrl so it submits with form */}
                            <input type="hidden" name="imageUrl" value={imageUrl} />

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                                <div className="flex space-x-2">
                                    <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-white/5 transition-all rounded-xl"
                                        onClick={() => setShowImageUpload(!showImageUpload)}
                                    >
                                        <div className="flex items-center gap-1.5 mr-2">
                                            <ImageIcon className="size-4" />
                                            <FilmIcon className="size-4" />
                                        </div>
                                        Media
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="ghost" className="text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                    <SubmitButton disabled={!contentVal.trim() && !imageUrl} />
                                </div>
                            </div>
                        </>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}

