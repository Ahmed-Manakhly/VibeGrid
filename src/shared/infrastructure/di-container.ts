import { prisma } from "./prisma";

// Vibe Module
import { PrismaVibeRepository } from "@/modules/vibe/infrastructure/PrismaVibeRepository";
import { CreateVibeUseCase } from "@/modules/vibe/application/CreateVibe.usecase";
import { GenerateFeedUseCase } from "@/modules/vibe/application/GenerateFeed.usecase";
import { DeleteVibeUseCase } from "@/modules/vibe/application/DeleteVibe.usecase";

// Engagement Module
import { PrismaEngagementRepository } from "@/modules/engagement/infrastructure/PrismaEngagementRepository";
import { ToggleLikeUseCase } from "@/modules/engagement/application/ToggleLike.usecase";
import { AddCommentUseCase } from "@/modules/engagement/application/AddComment.usecase";

// Notification Module
import { PrismaNotificationRepository } from "@/modules/notification/infrastructure/PrismaNotificationRepository";
import { GetNotificationsUseCase } from "@/modules/notification/application/GetNotifications.usecase";
import { MarkAsReadUseCase } from "@/modules/notification/application/MarkAsRead.usecase";
import { NotificationEventHandler } from "@/modules/notification/application/NotificationEventHandler";

// Auth Module
import { PrismaAuthRepository } from "@/modules/auth/infrastructure/PrismaAuthRepository";
import { SyncUserUseCase } from "@/modules/auth/application/SyncUser.usecase";
import { GetUserUseCase } from "@/modules/auth/application/GetUser.usecase";
import { ClerkAuthGateway } from "@/modules/auth/infrastructure/ClerkAuthGateway";

// Social Module
import { PrismaSocialRepository } from "@/modules/social/infrastructure/PrismaSocialRepository";
import { ToggleFollowUseCase } from "@/modules/social/application/ToggleFollow.usecase";
import { GetSuggestedUsersUseCase } from "@/modules/social/application/GetSuggestedUsers.usecase";
import { PrismaProfileRepository } from "@/modules/social/infrastructure/PrismaProfileRepository";
import { GetProfileUseCase } from "@/modules/social/application/GetProfile.usecase";
import { UpdateProfileUseCase } from "@/modules/social/application/UpdateProfile.usecase";

// Taxonomy Module
import { PrismaTaxonomyRepository } from "@/modules/taxonomy/infrastructure/PrismaTaxonomyRepository";
import { GetTaxonomyUseCase } from "@/modules/taxonomy/application/GetTaxonomy.usecase";
import { GetTrendingTagsUseCase } from "@/modules/taxonomy/application/GetTrendingTags.usecase";

// 1. Instantiate Repositories (Inject DB)
const vibeRepository = new PrismaVibeRepository(prisma);
const engagementRepository = new PrismaEngagementRepository(prisma);
const notificationRepository = new PrismaNotificationRepository(prisma);
const authRepository = new PrismaAuthRepository(prisma);
const socialRepository = new PrismaSocialRepository(prisma);
const taxonomyRepository = new PrismaTaxonomyRepository(prisma);
const profileRepository = new PrismaProfileRepository(prisma);

export const authGateway = new ClerkAuthGateway(prisma);

// 2. Instantiate Use Cases (Inject Repositories)
// Vibe
export const createVibeUseCase = new CreateVibeUseCase(vibeRepository);
export const generateFeedUseCase = new GenerateFeedUseCase(vibeRepository);
export const deleteVibeUseCase = new DeleteVibeUseCase(vibeRepository);

// Engagement
export const toggleLikeUseCase = new ToggleLikeUseCase(engagementRepository);
export const addCommentUseCase = new AddCommentUseCase(engagementRepository);

// Notification
export const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepository);
export const markAsReadUseCase = new MarkAsReadUseCase(notificationRepository);

// Auth
export const syncUserUseCase = new SyncUserUseCase(authRepository);
export const getUserUseCase = new GetUserUseCase(authRepository);

// Social
export const toggleFollowUseCase = new ToggleFollowUseCase(socialRepository);
export const getSuggestedUsersUseCase = new GetSuggestedUsersUseCase(socialRepository);
export const getProfileUseCase = new GetProfileUseCase(profileRepository);
export const updateProfileUseCase = new UpdateProfileUseCase(profileRepository);

// Taxonomy
export const getTaxonomyUseCase = new GetTaxonomyUseCase(taxonomyRepository);
export const getTrendingTagsUseCase = new GetTrendingTagsUseCase(taxonomyRepository);

// Initialize Event Handlers
export const notificationEventHandler = new NotificationEventHandler(notificationRepository);
