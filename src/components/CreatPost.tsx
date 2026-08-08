// 1st we need to create some actions > go to [user.action.ts]
//This is going to be a client component as we will use some states and we will not be able to use async

"use client"
//we can get the user from clerk in client component using clerk hook called useUser
import { useUser } from "@clerk/nextjs";
//--------------------
import { useState } from "react";
// ui imports
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ImageIcon, Loader2Icon, SendIcon } from "lucide-react";
import { creatPost } from "@/actions/post.action";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";

export default function CreatPost() {
    const {user } = useUser()
    const [content , setContent] = useState("")
    const [imageUrl , setImageUrl] = useState("")
    const [mood, setMood] = useState("neutral")
    const [tags, setTags] = useState("")
    const [isPosting , setIsPosting]=useState(false)
    const [showImageUpload , setShowImageUpload] = useState(false) // for showing the dropZone component
    //-------------------------------------- fun
    const handleSubmit = async ()=>{
        if(!content.trim() && !imageUrl) return
        setIsPosting(true)
        try{
            // Split tags string by comma and trim
            const parsedTags = tags.split(",").map(t => t.trim()).filter(Boolean);
            
            const result = await creatPost(content , imageUrl, parsedTags, mood); 
            if(result?.success){
                setContent('');
                setImageUrl('');
                setTags('');
                setMood('neutral');
                setShowImageUpload(false)
                toast.success('Vibe has been dropped successfully!')
            }
        }catch(er){
            console.error('failed to drop a vibe!' , er)
            toast.error('Failed to drop a vibe!')
        }finally{
            setIsPosting(false)
        }
    };
    //---------------------------------------
    return (
        <Card className="mb-6">
            <CardContent className="pt-6 ">
                <div className="space-y-4">
                    {/* we will use | npx shadcn@latest add textarea| for text area */}
                    {/* adding text area  + avatar inside flex div */}
                    <div className="flex space-x-4">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                        </Avatar>
                        <Textarea placeholder="Drop a vibe..." value={content} onChange={(e) => setContent(e.target.value)}
                            disabled={isPosting}
                            className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base" 
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-2 pb-2">
                        <Select value={mood} onValueChange={(value) => setMood(value)}>
                            <SelectTrigger className="w-[140px] h-8 text-sm bg-muted text-muted-foreground border-none">
                                <SelectValue placeholder="Mood" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="neutral">😐 Neutral</SelectItem>
                                <SelectItem value="excited">🚀 Excited</SelectItem>
                                <SelectItem value="learning">📚 Learning</SelectItem>
                                <SelectItem value="building">💻 Building</SelectItem>
                                <SelectItem value="debugging">🐛 Debugging</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input 
                            type="text" 
                            placeholder="Tags (comma separated, e.g. React, UI)" 
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="h-8 text-sm bg-muted text-muted-foreground border-none flex-1 min-w-[200px]"
                        />
                    </div>
                    {/* TODO: handle image upload */}
                    {(showImageUpload || imageUrl) && (
                        <div className="border rounded-lg p-4">
                            <ImageUpload endpoint="postImage" value={imageUrl} onChange={(url) => { setImageUrl(url); if (!url) setShowImageUpload(false); }} />
                        </div>
                    )}
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex space-x-2">
                            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-primary"
                                onClick={() => setShowImageUpload(!showImageUpload)} disabled={isPosting}
                            >
                                <ImageIcon className="size-4 mr-2" />
                                Photo
                            </Button>
                        </div>
                        <Button className="flex items-center" onClick={handleSubmit} disabled={(!content.trim() && !imageUrl) || isPosting} >
                            {isPosting ? (
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
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
