"use server" ;

import { prisma } from "@/shared/infrastructure/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";



//1//to sync the User between clerk and Prisma/DB
export async function syncUser(){
    try {
        //getting the userId & user from clerk
        const {userId} = await auth()
        const user = await currentUser();
        // if both null return
        if(!userId || !user) return;
        // if available so create the user if it's not created before
        //check if exists
        const existedUser = await prisma.user.findUnique({where : {clerkId : userId}})
        if(existedUser) return existedUser ;
        //create user
        const dbUser = await prisma.user.create({
            data : {
                clerkId : userId,
                name : `${user.firstName || ""} ${user.lastName || ""}`,
                username : user.username ??  user.emailAddresses[0].emailAddress.split('@')[0], //to get the 1st name from the email before '@' incase no username
                email : user.emailAddresses[0].emailAddress,
                image : user.imageUrl
            }
        })
        return dbUser ;
    }catch (er){
        console.log(er)
    }
}

//2//to show the user data 
export async function getUserByClerkId (clerkId : string){
    // we need to include some relations | _count parameter : number of objects > needs select relations > array you need : true
    return prisma.user.findUnique({where : {clerkId } , include : {_count : {select:{followers : true, following : true , posts : true}}}})
} // we have used server action for data fetching although it's still a post request


//3//get db user id using getUserByClerkId using clerkId from  auth()
export async function getDbUserId(){
    //rename it clerkId like our DB prop
    const {userId : clerkId} = await auth()
    // if(!clerkId) throw new Error("unauthorized!") // updated
    if(!clerkId) return null //to be used in other functions we need to rely on the result type
    //it will cause a type error in other functions that use it as the result type maybe null now instead of error | will fix it
    const user = await getUserByClerkId(clerkId) ;
    if(!user) throw new Error("user not found!")
    return user.id ;
}

//4//to fetch some users randomly
export async function getRandomUsers(){
    try {
        //exclude current user, or followed users by current user + make it 3 users
        const userId = await getDbUserId();
        if(!userId) return [] ;// for this type issue we return an empty array | so we handled scenario of type null
        const randomUsers = await prisma.user.findMany({
            where : {
                AND: [
                    {NOT: {id :userId }},
                    {NOT:{followers : {some :{followerId : userId}}}}
                ]
            },
            select :{
                id: true,
                name : true,
                username :  true,
                image : true,
                _count:{
                    select:{
                        followers : true,
                    }
                }
            },
            take : 3,
        })
        return randomUsers
    }catch(err){
        console.error("couldn't fetch users!",err)
        return [] ;// return an empty array for save typing
    }

}

//4//to create the relation-follow from the current user to the suggested user
export async function toggleFollow(targetUserId: string) { //the prop here is the suggested user-id
    try {
        const userId = await getDbUserId(); // current user-id
        if (!userId) return; // if no current user | also because we have updated to get null if no user | so aoid type error
        //-------------------------------------- we got targetUserId +  userId
        if (userId === targetUserId) throw new Error("You cannot follow yourself"); // if targetUserId +  userId are the same
        //--------------------------------------
        const existingFollow = await prisma.follows.findUnique({ //if the relation-follow existed [its id is a composite of (targetUserId +  userId )]
            where: {
                followerId_followingId: { // @@id([followerId , followingId]) === followerId_followingId by prisma === obj
                    followerId: userId,  //current user-id  sends to 
                    followingId: targetUserId, //suggested user-id
                }, // in this case we will remove the relation | if the data is not refreshed and the user wasn't disappeared
            },
        });
        //-------------------------------------
        if (existingFollow) {
            // unfollow
            await prisma.follows.delete({
                where: { // delete the relation data
                    followerId_followingId: {
                        followerId: userId,
                        followingId: targetUserId,
                    },
                },
            });
        } else {
            // follow
            await prisma.$transaction([ // TO CREATE MORE THAN ONE transaction | ALL OR NOTHING | SO BOTH SHOULD SUCCESS OR BOTH SHOULD FAIL
                prisma.follows.create({//create the relation data
                    data: {
                        followerId: userId,
                        followingId: targetUserId,
                    },
                }),
                //---------------------------------
                prisma.notifications.create({//create the notification data of the relation
                    data: {
                        type: "FOLLOW",
                        userId: targetUserId, // user being followed | RECEIVER
                        creatorId: userId, // user following | SENDER
                    },
                }),
            ]);
        }
        //------------------------------
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error in toggleFollow", error);
        return { success: false, error: "Error toggling follow" };
    }
}




