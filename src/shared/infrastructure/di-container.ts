import { prisma } from "./prisma";

// Cache & Logging Infrastructure
import { RedisCacheService } from "../infrastructure/cache/RedisCacheService";
import { PinoLogger } from "../infrastructure/PinoLogger";

export const logger = new PinoLogger("vibegrid-bff");

// Vibe Module
import { PrismaVibeRepository } from "@/modules/vibe/infrastructure/PrismaVibeRepository";
import { CreateVibeUseCase } from "@/modules/vibe/application/CreateVibe.usecase";
import { GenerateFeedUseCase } from "@/modules/vibe/application/GenerateFeed.usecase";
import { DeleteVibeUseCase } from "@/modules/vibe/application/DeleteVibe.usecase";

// Engagement Module
import { PrismaEngagementRepository } from "@/modules/engagement/infrastructure/PrismaEngagementRepository";
import { ToggleLikeUseCase } from "@/modules/engagement/application/ToggleLike.usecase";
import { ToggleReGridUseCase } from "@/modules/engagement/application/ToggleReGrid.usecase";
import { AddCommentUseCase } from "@/modules/engagement/application/AddComment.usecase";
import { DeleteCommentUseCase } from "@/modules/engagement/application/DeleteComment.usecase";

// Notification Module
import { PrismaNotificationRepository } from "@/modules/notification/infrastructure/PrismaNotificationRepository";
import { GetNotificationsUseCase } from "@/modules/notification/application/GetNotifications.usecase";
import { MarkAsReadUseCase } from "@/modules/notification/application/MarkAsRead.usecase";
import { NotificationEventHandler } from "@/modules/notification/application/NotificationEventHandler";

// Auth Module
import { PrismaAuthRepository } from "@/modules/auth/infrastructure/PrismaAuthRepository";
import { SyncUserUseCase } from "@/modules/auth/application/SyncUser.usecase";
import { GetUserUseCase } from "@/modules/auth/application/GetUser.usecase";
import { BffAuthGateway } from "@/modules/auth/infrastructure/BffAuthGateway";

// Social Module
import { PrismaSocialRepository } from "@/modules/social/infrastructure/PrismaSocialRepository";
import { ToggleFollowUseCase } from "@/modules/social/application/ToggleFollow.usecase";
import { GetSuggestedUsersUseCase } from "@/modules/social/application/GetSuggestedUsers.usecase";
import { PrismaProfileRepository } from "@/modules/social/infrastructure/PrismaProfileRepository";
import { GetProfileUseCase } from "@/modules/social/application/GetProfile.usecase";
import { UpdateProfileUseCase } from "@/modules/social/application/UpdateProfile.usecase";
import { IsFollowingUseCase } from "@/modules/social/application/IsFollowing.usecase";

// Taxonomy Module
import { PrismaTaxonomyRepository } from "@/modules/taxonomy/infrastructure/PrismaTaxonomyRepository";
import { GetTaxonomyUseCase } from "@/modules/taxonomy/application/GetTaxonomy.usecase";
import { GetTrendingTagsUseCase } from "@/modules/taxonomy/application/GetTrendingTags.usecase";
import { CreateCategoryUseCase } from "@/modules/taxonomy/application/CreateCategory.usecase";
import { CreateVibeTaxonomyUseCase } from "@/modules/taxonomy/application/CreateVibeTaxonomy.usecase";

// Outbox Module
import { PrismaOutboxRepository } from "@/modules/outbox/infrastructure/PrismaOutboxRepository";
import { TransactionalOutboxEventBus } from "@/modules/outbox/infrastructure/TransactionalOutboxEventBus";

// 0. Cache Singleton
export const cacheService = new RedisCacheService();

// 1. Instantiate Repositories (Inject DB)
export const outboxRepository = new PrismaOutboxRepository(prisma);
export const vibeRepository = new PrismaVibeRepository(prisma);
const engagementRepository = new PrismaEngagementRepository(prisma);
const notificationRepository = new PrismaNotificationRepository(prisma);
const authRepository = new PrismaAuthRepository(prisma);
const socialRepository = new PrismaSocialRepository(prisma);
const taxonomyRepository = new PrismaTaxonomyRepository(prisma);
const profileRepository = new PrismaProfileRepository(prisma);

export const authGateway = new BffAuthGateway(prisma);
export const eventBus = new TransactionalOutboxEventBus(outboxRepository);

// 2. Instantiate Use Cases (Inject Repositories & Cache)
// Vibe
export const createVibeUseCase = new CreateVibeUseCase(vibeRepository, eventBus, cacheService);
export const generateFeedUseCase = new GenerateFeedUseCase(vibeRepository, cacheService);
export const deleteVibeUseCase = new DeleteVibeUseCase(vibeRepository, eventBus, cacheService);
export const getPostByIdUseCase = new (require('@/modules/vibe/application/GetPostById.usecase').GetPostByIdUseCase)(vibeRepository);

// Engagement
export const toggleLikeUseCase = new ToggleLikeUseCase(engagementRepository, eventBus);
export const toggleReGridUseCase = new ToggleReGridUseCase(engagementRepository, eventBus);
export const addCommentUseCase = new AddCommentUseCase(engagementRepository, eventBus);
export const deleteCommentUseCase = new DeleteCommentUseCase(engagementRepository);

// Notification
export const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepository);
export const markAsReadUseCase = new MarkAsReadUseCase(notificationRepository);

// Auth
export const syncUserUseCase = new SyncUserUseCase(authRepository);
export const getUserUseCase = new GetUserUseCase(authRepository);

// Social
export const toggleFollowUseCase = new ToggleFollowUseCase(socialRepository, eventBus);
export const getSuggestedUsersUseCase = new GetSuggestedUsersUseCase(socialRepository, cacheService);
export const getProfileUseCase = new GetProfileUseCase(profileRepository, cacheService);
export const updateProfileUseCase = new UpdateProfileUseCase(profileRepository, cacheService);
export const isFollowingUseCase = new IsFollowingUseCase(socialRepository);

// Taxonomy
export const getTaxonomyUseCase = new GetTaxonomyUseCase(taxonomyRepository, cacheService);
export const getTrendingTagsUseCase = new GetTrendingTagsUseCase(taxonomyRepository);
export const createCategoryUseCase = new CreateCategoryUseCase(taxonomyRepository);
export const createVibeTaxonomyUseCase = new CreateVibeTaxonomyUseCase(taxonomyRepository);

// Initialize Event Handlers
export const notificationEventHandler = new NotificationEventHandler(notificationRepository, eventBus);

