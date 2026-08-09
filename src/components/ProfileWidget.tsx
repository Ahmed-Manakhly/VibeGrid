import { currentUser  } from '@clerk/nextjs/server'
import React from 'react'
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent} from './ui/card'
import { Button } from './ui/button'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import Link from 'next/link'
import { getUserByClerkId } from '@/actions/user.action'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Separator } from './ui/separator'
import { LinkIcon, MapPinIcon } from 'lucide-react'

//if there is no user we will show the below/ if the user is Authenticated, we will show the normal Sidebar/ and the condition will be inside the Sidebar
// we will use npx shadcn@latest add card |  and we got it in the [ui]
const UnauthenticatedSidebar = async ()=>{
    return(
    <div className="sticky top-20">
        <Card className="surface-panel transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-center text-xl font-semibold">Welcome Back!</CardTitle>
            </CardHeader>
            <CardContent>
                {/* this var text-muted-foreground from shad cn */}
                <p className="text-center text-muted-foreground mb-4">
                    Login to access your profile and connect with others.
                </p>
                <SignInButton mode="modal">
                    <Button className="w-full" variant="outline">
                        Login
                    </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                    <Button className="w-full mt-2" variant="default">
                        Sign Up
                    </Button>
                </SignUpButton>
            </CardContent>
        </Card>
    </div>
    )
}

async function ProfileWidget() {
    const authUser = await currentUser() // user from clerk
    if(!authUser) return <UnauthenticatedSidebar/> ;
    //go to user.action to create the action for showing user data from DB using user id from clerk
    const user = await getUserByClerkId(authUser.id);
    if (!user) return null; // we can throu an error here
    //we will use | npx shadcn@latest add avatar |  and we got it in the [ui]
    //we will use | npx shadcn@latest add separator |  and we got it in the [ui]
    return (
        <div className="sticky top-20">
            <Card className="surface-panel transition-all duration-300">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                        <Link href={`/profile/${user.username}`} className="flex flex-col items-center justify-center" >
                            <Avatar className="w-20 h-20 border-2 border-primary/20 hover:border-primary transition-all duration-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.2)]">
                                <AvatarImage src={user.image || "/avatar.png"} /> {/**if no image we will use the placeholder */}
                                {/* need to create a public folder */}
                            </Avatar>
                            <div className="mt-4 space-y-1">
                                <h3 className="font-semibold">{user.name}</h3>
                                <p className="text-sm text-muted-foreground">{user.username}</p>
                            </div>
                        </Link>
                        {user.bio && <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>}
                        <div className="w-full">
                            <Separator className="my-4" />
                            <div className="flex justify-between">
                                <div>
                                    <p className="font-medium text-primary font-mono">{user._count.following}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Tuning In</p>
                                </div>
                                <Separator orientation="vertical" className="bg-white/10" />
                                <div>
                                    <p className="font-medium text-primary font-mono">{user._count.followers}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Tuned In</p>
                                </div>
                            </div>
                            <Separator className="my-4" />
                        </div>
                        <div className="w-full space-y-2 text-sm">
                            <div className="flex items-center text-muted-foreground">
                                <MapPinIcon className="w-4 h-4 mr-2" />
                                {user.location || "No location"}
                            </div>
                            <div className="flex items-center text-muted-foreground">
                                <LinkIcon className="w-4 h-4 mr-2 shrink-0" />
                                {user.website ? (
                                    <a href={`${user.website}`} className="hover:underline truncate" target="_blank">
                                    {user.website}
                                    </a>
                                ) : (
                                    "No website"
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ProfileWidget