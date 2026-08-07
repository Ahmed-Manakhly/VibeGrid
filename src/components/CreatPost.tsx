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

export default function CreatPost() {
    const {user } = useUser()
    const [content , setContent] = useState("")
    const [imageUrl , setImageUrl] = useState("")
    const [isPosting , setIsPosting]=useState(false)
    const [showImageUpload , setShowImageUpload] = useState(false) // for showing the dropZone component
    //-------------------------------------- fun
    const handleSubmit = async ()=>{
        if(!content.trim() && !imageUrl) return
        setIsPosting(true)
        try{
            const result = await creatPost(content , imageUrl); // will be create in [post.action.ts] | set (content , imageUrl) as params
            // adding result?.success as result possible to be undefined 
            if(result?.success){
                //reset the form 
                setContent('');
                setImageUrl('');
                setShowImageUpload(false)
                //show toast | we will use "https://react-hot-toast.com/"
                    //1- we set the component <Toaster/> ON THE LAYOUT
                    //2- we import it
                toast.success('Post has been created successfully!')
            }
        }catch(er){
            console.error('failed to create a post!' , er)
            toast.error('Failed to create a post!')
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
                        <Textarea placeholder="What's on your mind?" value={content} onChange={(e) => setContent(e.target.value)}
                            disabled={isPosting}
                            className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base" 
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
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <SendIcon className="size-4 mr-2" />
                                    Post
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
