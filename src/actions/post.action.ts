"use server" ;

import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

import { 
    createVibeUseCase, 
    generateFeedUseCase, 
    deleteVibeUseCase,
    toggleLikeUseCase,
    toggleReGridUseCase,
    toggleBookmarkUseCase,
    addCommentUseCase,
    deleteCommentUseCase,
    getPostByIdUseCase,
    trustSafetyRepository,
    logger
} from "@/shared/infrastructure/di-container";
import { ExplorePostsCriteria } from "@/modules/vibe/domain/ExplorePostsCriteria";

//1//to create the post
export async function creatPost(
    content: string,
    mediaUrl?: string,
    mediaType?: any,
    tags?: string[],
    categoryId?: string,
    vibeId?: string,
    techContext?: any,
    postType?: any,
    poll?: { question: string; options: string[]; durationHours: number },
    quotedPostId?: string,
    communityId?: string
) {
    try {
        const userId = await getDbUserId() ;
        if(!userId) return { success: false, error: 'User is not authenticated. Please log in.' }; 
        
        const result = await createVibeUseCase.execute(content, mediaUrl, mediaType, userId, tags, undefined, categoryId, vibeId, techContext, postType, poll, quotedPostId, communityId);
        
        if (!result.success) {
            const errorMsg = typeof result.error === 'object' && result.error && 'message' in result.error 
                ? (result.error as any).message 
                : (typeof result.error === 'string' ? result.error : 'Failed to create a post!');
            return { success: false, error: errorMsg };
        }

        revalidatePath('/') ; 
        return {success : true , post: result.value} ; 
    }catch (er: any){
        logger.error('failed to create a post!', er);
        return {success : false, error : er?.message || 'Failed to create a post!'}
    }
}

// 1.2 helper to create a quote vibe
export async function createQuoteVibeAction(quotedPostId: string, content: string) {
    if (!quotedPostId) return { success: false, error: "Target vibe ID is required to quote." };
    if (!content?.trim()) return { success: false, error: "Quote commentary cannot be empty." };
    return await creatPost(content.trim(), undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, quotedPostId);
}

import { PostContentValueObject, SupportedLanguage } from "@/modules/vibe/domain/PostContentValueObject";
import { ShipTechContextValueObject } from "@/modules/vibe/domain/ShipTechContext";

// 1.5 wrapper for react 19 form actions
export async function createPostFormAction(prevState: any, formData: FormData) {
    const rawContent = formData.get('content') as string || '';
    const codeSnippet = formData.get('codeSnippet') as string;
    const codeLanguage = (formData.get('codeLanguage') as string || 'typescript') as SupportedLanguage;

    const mediaUrl = formData.get('mediaUrl') as string || formData.get('imageUrl') as string;
    const rawMediaType = formData.get('mediaType') as string;
    const mediaType = rawMediaType ? (rawMediaType.toUpperCase() as any) : undefined;
    const tagsRaw = formData.get('tags') as string;
    const categoryId = formData.get('categoryId') as string;
    const vibeId = formData.get('vibeId') as string;
    const quotedPostId = formData.get('quotedPostId') as string;
    const communityId = formData.get('communityId') as string;

    // Ship Mode Inputs
    const isShip = formData.get('isShip') === 'true' || formData.get('isShip') === 'on';
    const projectName = formData.get('projectName') as string;
    const tagline = formData.get('tagline') as string;
    const demoUrl = formData.get('demoUrl') as string;
    const repoUrl = formData.get('repoUrl') as string;
    const techStackRaw = formData.get('techStack') as string;

    let techContext: any = null;
    let postType: any = undefined;

    if (isShip && projectName?.trim()) {
        const techStack = techStackRaw ? techStackRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
        techContext = ShipTechContextValueObject.validate({
            isShip: true,
            projectName,
            tagline,
            demoUrl,
            repoUrl,
            techStack,
        });
        postType = "PROJECT_SHIP";
    } else if (isShip && !projectName?.trim()) {
        return { success: false, error: 'Please enter a project name for Show & Ship mode.' };
    }

    // Dilemma Poll Inputs
    const isPoll = formData.get('isPoll') === 'true' || formData.get('isPoll') === 'on';
    const pollQuestion = formData.get('pollQuestion') as string;
    const pollOptionsRaw = formData.getAll('pollOption') as string[];
    const pollDurationHours = parseInt(formData.get('pollDurationHours') as string || '24', 10);

    let pollData: any = undefined;
    if (isPoll) {
        if (!pollQuestion?.trim()) {
            return { success: false, error: 'Please enter a question for your Tech Dilemma Poll.' };
        }
        const validOptions = pollOptionsRaw.map(o => o.trim()).filter(Boolean);
        if (validOptions.length < 2) {
            return { success: false, error: 'A poll must have at least 2 non-empty options.' };
        }
        pollData = {
            question: pollQuestion.trim(),
            options: validOptions.slice(0, 4),
            durationHours: isNaN(pollDurationHours) ? 24 : pollDurationHours,
        };
        postType = "DILEMMA_POLL";
    }

    const finalContent = PostContentValueObject.format(
        rawContent,
        codeSnippet?.trim() ? { language: codeLanguage, code: codeSnippet } : undefined
    );

    if (!finalContent?.trim() && !mediaUrl && !techContext && !pollData) {
        return { success: false, error: 'Post cannot be empty. Please enter some text, upload media, or add a poll.' };
    }

    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : undefined;

    try {
        const result = await creatPost(finalContent, mediaUrl, mediaType, tags, categoryId || undefined, vibeId || undefined, techContext, postType, pollData, quotedPostId || undefined, communityId || undefined);
        if (result?.success) {
            return { success: true };
        }
        return { success: false, error: result?.error || 'Failed to drop vibe.' };
    } catch (err: any) {
        logger.error('Error in createPostFormAction', err);
        const rawMsg = err.message || '';
        if (rawMsg.includes('Invalid `prisma.post.create()`') || rawMsg.includes('PrismaClientValidationError')) {
            return { success: false, error: 'Could not create post. Please check the post details and try again.' };
        }
        return { success: false, error: rawMsg || 'Something went wrong.' };
    }
}

//2//to get all posts
export async function getPosts(params: ExplorePostsCriteria = {}) {
    try {
        const userId = params.userId || (await getDbUserId()) || undefined;

        // Fetch bidirectional blocked user IDs to filter out blocked posts completely
        let excludeAuthorIds: string[] = [];
        if (userId) {
            try {
                const blockedIds = await trustSafetyRepository.getBlockedUserIds(userId);
                if (blockedIds && blockedIds.length > 0) {
                    excludeAuthorIds = blockedIds;
                }
            } catch (err) {
                // Fallback silently if safety check fails
            }
        }

        const result = await generateFeedUseCase.execute({
            ...params,
            userId,
            excludeAuthorIds: excludeAuthorIds.length > 0 ? excludeAuthorIds : undefined,
        });
        return result; 
    } catch (er){
        logger.error('failed to fetch posts!', er);
        return { data: [], nextCursor: null };
    }
}
//3// to toggle Likes on the post
export async function toggleLike(postId : string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return;
        
        const result = await toggleLikeUseCase.execute(postId, userId);
        if (!result.success) {
            return {success : false, error : 'failed to toggle like!'}
        }

        revalidatePath('/') ;
        return {success : true} ;
    } catch (error) {
        logger.error('failed to toggle like!', error, { postId });
        return {success : false, error : 'failed to toggle like!'}
    }
}

//3.5 to toggle Bookmarks on the post
export async function toggleBookmark(postId : string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return { success: false, error: 'Unauthorized' };
        
        const result = await toggleBookmarkUseCase.execute(postId, userId);
        if (!result.success) {
            return {success : false, error : 'failed to toggle bookmark!'}
        }

        revalidatePath('/') ;
        return {success : true, isBookmarked: result.value.isBookmarked} ;
    } catch (error) {
        logger.error('failed to toggle bookmark!', error, { postId });
        return {success : false, error : 'failed to toggle bookmark!'}
    }
}

//3.6 to toggle ReGrid (Repost/Share) on the post
export async function toggleReGrid(postId : string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return { success: false, error: 'Unauthorized' };
        
        const result = await toggleReGridUseCase.execute(postId, userId);
        if (!result.success) {
            return {success : false, error : 'failed to toggle regrid!'}
        }

        revalidatePath('/') ;
        return {success : true, isReGridded: result.value.isReGridded} ;
    } catch (error) {
        logger.error('failed to toggle regrid!', error, { postId });
        return {success : false, error : 'failed to toggle regrid!'}
    }
}

//4//to create a comment or reply
export async function createComment(postId : string, content : string, parentId?: string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return { success: false, error: 'Unauthorized' };
        if(!content) throw new Error('comment content is required!') ;
        
        const result = await addCommentUseCase.execute(postId, userId, content, parentId);
        if (!result.success) {
            return {success : false, error : 'failed to create a comment!'}
        }

        revalidatePath('/') ;
        return {success : true , comment: result.value.comment};
    }catch (error){
        logger.error('failed to create comment!', error, { postId });
        return {success : false, error : 'failed to create a comment!'}
    }
}

//4.5 to delete a comment
export async function deleteComment(commentId: string) {
    try {
        const userId = await getDbUserId();
        if(!userId) return;
        
        const result = await deleteCommentUseCase.execute(commentId, userId);
        if (!result.success) {
            return {success: false, error: 'failed to delete comment'};
        }
        
        revalidatePath('/');
        return {success: true};
    } catch (error) {
        logger.error('failed to delete comment', error, { commentId });
        return {success: false, error: 'failed to delete comment'};
    }
}

export async function getPostById(postId: string) {
    try {
        const post = await getPostByIdUseCase.execute(postId);
        return post;
    } catch (error) {
        logger.error('failed to get post', error, { postId });
        return null;
    }
}

//5//to delete the post
export async function deletePost(postId : string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return ;
        
        const result = await deleteVibeUseCase.execute(postId, userId);
        if (!result.success) {
             throw new Error(result.error.message);
        }

        revalidatePath('/') ; // purge the cash
        return {success : true} ;
    }catch (er: any){
        logger.error('failed to delete a post!', er, { postId });
        return {success : false, error : er.message || 'failed to delete a post!'}
    }
}

export async function votePollAction(pollId: string, optionId: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) {
            return { success: false, error: 'You must be logged in to vote.' };
        }

        const { pollRepository, cacheService } = await import("@/shared/infrastructure/di-container");
        const result = await pollRepository.castVote({ pollId, optionId, userId });

        // Invalidate cached tallies
        await cacheService.delete(`poll:${pollId}:tallies`);
        revalidatePath('/');

        return { success: true, tallies: result.tallies };
    } catch (error: any) {
        logger.error('Error casting poll vote', error, { pollId, optionId });
        if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
            return { success: false, error: 'You have already voted in this poll.' };
        }
        return { success: false, error: error.message || 'Failed to record vote' };
    }
}

export async function getPollTalliesAction(pollId: string) {
    try {
        const userId = await getDbUserId();
        const { pollRepository, cacheService } = await import("@/shared/infrastructure/di-container");

        const cacheKey = `poll:${pollId}:tallies`;
        let cached = await cacheService.get<any>(cacheKey);

        if (!cached) {
            cached = await pollRepository.getTallies(pollId, null);
            if (cached) {
                await cacheService.set(cacheKey, cached, 60); // 1 min TTL
            }
        }

        if (cached && userId) {
            const userPoll = await pollRepository.findById(pollId, userId);
            return {
                ...cached,
                userVotedOptionId: userPoll?.userVotedOptionId || null,
            };
        }

        return cached;
    } catch (error) {
        logger.error('Error fetching poll tallies', error, { pollId });
        return null;
    }
}

export async function getTrendingShipsAction(limit: number = 6) {
    try {
        const { vibeRepository, cacheService } = await import("@/shared/infrastructure/di-container");
        const cacheKey = `leaderboard:ships:daily:${limit}`;

        const cached = await cacheService.get<any[]>(cacheKey);
        if (cached) return cached;

        const rawPosts = await vibeRepository.getTrendingShips(limit * 3);
        const { TrendingShipsScorer } = await import("@/modules/vibe/domain/TrendingShipsScorer");
        const ranked = TrendingShipsScorer.rankShipPosts(rawPosts).slice(0, limit);

        await cacheService.set(cacheKey, ranked, 300); // 5 min TTL
        return ranked;
    } catch (error) {
        logger.error('Error fetching trending ships leaderboard', error);
        return [];
    }
}

