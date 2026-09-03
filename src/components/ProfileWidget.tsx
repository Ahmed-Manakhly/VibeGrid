import React from 'react'
import { Card, CardHeader, CardTitle, CardContent} from './ui/card'
import { Button } from './ui/button'
import Link from 'next/link'
import { getCurrentSession } from '@/lib/auth/server'
import { getUserById } from '@/actions/user.action'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from './ui/separator'
import { LinkIcon, MapPinIcon } from 'lucide-react'

const UnauthenticatedSidebar = async () => {
    return (
    <div className="sticky top-20">
        <Card className="surface-panel transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-center text-xl font-semibold">Welcome Back!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground mb-4">
                    Login to access your profile and connect with others.
                </p>
                <Button className="w-full" variant="outline" asChild>
                    <Link href="/login">Login</Link>
                </Button>
                <Button className="w-full mt-2" variant="default" asChild>
                    <Link href="/register">Sign Up</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
    )
}

async function ProfileWidget() {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) return <UnauthenticatedSidebar />;
    
    const user = await getUserById(session.user.id);
    if (!user) {
        return (
            <div className="sticky top-20">
                <Card className="surface-panel transition-all duration-300">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="w-20 h-20">
                                <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="mt-4 space-y-1">
                                <h3 className="font-semibold">{session.user.name || session.user.email.split('@')[0]}</h3>
                                <p className="text-sm text-muted-foreground">{session.user.email}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="sticky top-20">
            <Card className="surface-panel transition-all duration-300">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                        <Link href={`/profile/${user.username}`} className="flex flex-col items-center justify-center" >
                            <Avatar className="w-20 h-20 transition-all duration-300">
                                <AvatarImage src={user.image || "/avatar.png"} />
                                <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
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
                                    <p className="font-medium text-primary font-mono">{user._count?.following || 0}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Tuning In</p>
                                </div>
                                <Separator orientation="vertical" className="bg-white/10" />
                                <div>
                                    <p className="font-medium text-primary font-mono">{user._count?.followers || 0}</p>
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
                                    <a href={`${user.website}`} className="hover:underline truncate" target="_blank" rel="noreferrer">
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