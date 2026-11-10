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
import { ImageIcon, FilmIcon, Loader2Icon, SendIcon, CodeIcon, RocketIcon, BarChart3, Plus, Trash2 } from "lucide-react";
import { createPostFormAction } from "@/actions/post.action";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
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
    const router = useRouter();
    const initialLetter = getDisplayInitial(user);
    const displayName = user?.name || user?.email?.split('@')[0] || "You";
    
    // UI state only (not form data)
    const [imageUrl, setImageUrl] = useState("");
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [showCodeBlock, setShowCodeBlock] = useState(false);
    const [showShipMode, setShowShipMode] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [demoUrl, setDemoUrl] = useState("");
    const [repoUrl, setRepoUrl] = useState("");
    const [techStack, setTechStack] = useState("");
    const [showPoll, setShowPoll] = useState(false);
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
    const [pollDuration, setPollDuration] = useState("24");
    const [codeSnippet, setCodeSnippet] = useState("");
    const [codeLanguage, setCodeLanguage] = useState("typescript");
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
            setCodeSnippet("");
            setShowShipMode(false);
            setProjectName("");
            setDemoUrl("");
            setRepoUrl("");
            setTechStack("");
            setShowPoll(false);
            setPollQuestion("");
            setPollOptions(["", ""]);
            setPollDuration("24");
            setShowImageUpload(false);
            setShowCodeBlock(false);
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
        setShowCodeBlock(false);
        setShowShipMode(false);
        setShowPoll(false);
        setContentVal('');
        setImageUrl('');
        setCodeSnippet('');
        setProjectName('');
        setDemoUrl('');
        setRepoUrl('');
        setTechStack('');
        setPollQuestion('');
        setPollOptions(["", ""]);
        setPollDuration("24");
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
                            
                            {(showCodeBlock || codeSnippet) && (
                                <div className="border border-border/60 rounded-xl p-3 bg-card/60 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CodeIcon className="size-4 text-primary" />
                                            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">Code Snippet</span>
                                        </div>
                                        <Select name="codeLanguage" value={codeLanguage} onValueChange={setCodeLanguage}>
                                            <SelectTrigger className="w-[140px] h-7 text-xs bg-background border-border/50 font-mono rounded-lg">
                                                <SelectValue placeholder="Language" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border-border/50 font-mono">
                                                <SelectItem value="typescript">TypeScript</SelectItem>
                                                <SelectItem value="javascript">JavaScript</SelectItem>
                                                <SelectItem value="tsx">TSX</SelectItem>
                                                <SelectItem value="jsx">JSX</SelectItem>
                                                <SelectItem value="python">Python</SelectItem>
                                                <SelectItem value="sql">SQL</SelectItem>
                                                <SelectItem value="json">JSON</SelectItem>
                                                <SelectItem value="bash">Bash / Shell</SelectItem>
                                                <SelectItem value="html">HTML</SelectItem>
                                                <SelectItem value="css">CSS</SelectItem>
                                                <SelectItem value="java">Java</SelectItem>
                                                <SelectItem value="go">Go</SelectItem>
                                                <SelectItem value="csharp">C#</SelectItem>
                                                <SelectItem value="cpp">C++</SelectItem>
                                                <SelectItem value="php">PHP</SelectItem>
                                                <SelectItem value="rust">Rust</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Textarea
                                        name="codeSnippet"
                                        placeholder="// Paste your code snippet here..."
                                        value={codeSnippet}
                                        onChange={(e) => setCodeSnippet(e.target.value)}
                                        className="min-h-[120px] font-mono text-xs bg-background/80 border border-border/40 rounded-lg p-3 resize-y focus-visible:ring-1 focus-visible:ring-primary/50"
                                    />
                                </div>
                            )}

                            {showShipMode && (
                                <div className="border border-brand-gold/40 rounded-2xl p-4 bg-gradient-to-br from-brand-gold/10 via-background/80 to-brand-gold-muted/10 space-y-3.5 backdrop-blur-sm shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <RocketIcon className="size-4 text-brand-gold animate-pulse" />
                                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-gold">Show & Ship Mode</span>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground font-mono">Project Launch</span>
                                    </div>

                                    <input type="hidden" name="isShip" value="true" />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Input
                                            name="projectName"
                                            placeholder="Project Name (e.g. VibeGrid)"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            className="h-9 text-xs sm:text-sm bg-background/80 border-brand-gold/30 focus-visible:border-brand-gold/60 rounded-xl"
                                        />
                                        <Input
                                            name="techStack"
                                            placeholder="Tech Stack (comma separated: Next.js, Prisma, Tailwind)"
                                            value={techStack}
                                            onChange={(e) => setTechStack(e.target.value)}
                                            className="h-9 text-xs sm:text-sm bg-background/80 border-brand-gold/30 focus-visible:border-brand-gold/60 rounded-xl"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Input
                                            name="demoUrl"
                                            type="url"
                                            placeholder="Live Demo URL (https://...)"
                                            value={demoUrl}
                                            onChange={(e) => setDemoUrl(e.target.value)}
                                            className="h-9 text-xs sm:text-sm bg-background/80 border-brand-gold/30 focus-visible:border-brand-gold/60 rounded-xl"
                                        />
                                        <Input
                                            name="repoUrl"
                                            type="url"
                                            placeholder="Repository URL (https://github.com/...)"
                                            value={repoUrl}
                                            onChange={(e) => setRepoUrl(e.target.value)}
                                            className="h-9 text-xs sm:text-sm bg-background/80 border-brand-gold/30 focus-visible:border-brand-gold/60 rounded-xl"
                                        />
                                    </div>
                                </div>
                            )}

                            {showPoll && (
                                <div className="border border-primary/40 rounded-2xl p-4 bg-gradient-to-br from-primary/10 via-background/80 to-muted/20 space-y-3.5 backdrop-blur-sm shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="size-4 text-primary" />
                                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">Tech Dilemma Poll</span>
                                        </div>
                                        <Select name="pollDurationHours" value={pollDuration} onValueChange={setPollDuration}>
                                            <SelectTrigger className="w-[110px] h-7 text-xs bg-background/80 border-border/50 font-mono rounded-lg">
                                                <SelectValue placeholder="Duration" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border-border/50 font-mono">
                                                <SelectItem value="24">24 Hours</SelectItem>
                                                <SelectItem value="72">3 Days</SelectItem>
                                                <SelectItem value="168">7 Days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <input type="hidden" name="isPoll" value="true" />

                                    <Input
                                        name="pollQuestion"
                                        placeholder="What's the dilemma? (e.g. Postgres vs SQLite for embedded local dev?)"
                                        value={pollQuestion}
                                        onChange={(e) => setPollQuestion(e.target.value)}
                                        maxLength={200}
                                        className="h-9 text-xs sm:text-sm bg-background/80 border-primary/30 rounded-xl"
                                    />

                                    <div className="space-y-2">
                                        {pollOptions.map((opt, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <Input
                                                    name="pollOption"
                                                    placeholder={`Option ${idx + 1}`}
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const copy = [...pollOptions];
                                                        copy[idx] = e.target.value;
                                                        setPollOptions(copy);
                                                    }}
                                                    className="h-8 text-xs bg-background/80 border-border/50 rounded-lg flex-1"
                                                />
                                                {pollOptions.length > 2 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPollOptions(pollOptions.filter((_, i) => i !== idx));
                                                        }}
                                                        className="p-1.5 text-muted-foreground hover:text-destructive transition"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {pollOptions.length < 4 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPollOptions([...pollOptions, ""])}
                                                className="text-xs h-7 gap-1 border-dashed"
                                            >
                                                <Plus className="size-3" />
                                                Add Option ({pollOptions.length}/4)
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(showImageUpload || imageUrl) && (
                                <div className="border rounded-lg p-4">
                                    <ImageUpload endpoint="postImage" value={imageUrl} onChange={(url) => { setImageUrl(url); if (!url) setShowImageUpload(false); }} />
                                </div>
                            )}
                            
                            {/* Hidden input for imageUrl so it submits with form */}
                            <input type="hidden" name="imageUrl" value={imageUrl} />

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10 pt-4">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-white/5 transition-all rounded-xl px-2.5 sm:px-3"
                                        onClick={() => setShowImageUpload(!showImageUpload)}
                                    >
                                        <div className="flex items-center gap-1.5 mr-1.5">
                                            <ImageIcon className="size-4" />
                                            <FilmIcon className="size-4" />
                                        </div>
                                        Media
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" className={`hover:text-primary hover:bg-white/5 transition-all rounded-xl px-2.5 sm:px-3 ${showCodeBlock ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                                        onClick={() => setShowCodeBlock(!showCodeBlock)}
                                    >
                                        <CodeIcon className="size-4 mr-1.5" />
                                        Code
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" className={`hover:text-brand-gold hover:bg-brand-gold/10 transition-all rounded-xl px-2.5 sm:px-3 ${showShipMode ? "text-brand-gold bg-brand-gold/15 border border-brand-gold/30" : "text-muted-foreground"}`}
                                        onClick={() => setShowShipMode(!showShipMode)}
                                    >
                                        <RocketIcon className="size-4 mr-1.5" />
                                        Ship
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" className={`hover:text-primary hover:bg-primary/10 transition-all rounded-xl px-2.5 sm:px-3 ${showPoll ? "text-primary bg-primary/15 border border-primary/30" : "text-muted-foreground"}`}
                                        onClick={() => setShowPoll(!showPoll)}
                                    >
                                        <BarChart3 className="size-4 mr-1.5" />
                                        Poll
                                    </Button>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t border-white/5 sm:border-0 w-full sm:w-auto">
                                    <Button type="button" variant="ghost" className="text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                    <SubmitButton disabled={!contentVal.trim() && !imageUrl && !codeSnippet.trim() && !projectName.trim() && (!pollQuestion.trim() || pollOptions.filter(Boolean).length < 2)} />
                                </div>
                            </div>
                        </>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}

