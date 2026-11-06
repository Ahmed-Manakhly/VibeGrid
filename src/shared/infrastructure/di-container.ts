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
import { ToggleBookmarkUseCase } from "@/modules/engagement/application/ToggleBookmark.usecase";
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
export { refreshSessionCoordinator } from "@/modules/auth/infrastructure/refreshCoordinator";

// Social Module
import { PrismaSocialRepository } from "@/modules/social/infrastructure/PrismaSocialRepository";
import { ToggleFollowUseCase } from "@/modules/social/application/ToggleFollow.usecase";
import { GetSuggestedUsersUseCase } from "@/modules/social/application/GetSuggestedUsers.usecase";
import { SearchUsersUseCase } from "@/modules/social/application/SearchUsers.usecase";
import { PrismaProfileRepository } from "@/modules/social/infrastructure/PrismaProfileRepository";
import { PrismaUserInterestRepository } from "@/modules/social/infrastructure/PrismaUserInterestRepository";
import { GetProfileUseCase } from "@/modules/social/application/GetProfile.usecase";
import { UpdateProfileUseCase } from "@/modules/social/application/UpdateProfile.usecase";
import { IsFollowingUseCase } from "@/modules/social/application/IsFollowing.usecase";
import { GetUserInterestsUseCase } from "@/modules/social/application/GetUserInterests.usecase";
import { SetUserInterestsUseCase } from "@/modules/social/application/SetUserInterests.usecase";

// Taxonomy Module
import { PrismaTaxonomyRepository } from "@/modules/taxonomy/infrastructure/PrismaTaxonomyRepository";
import { GetTaxonomyUseCase } from "@/modules/taxonomy/application/GetTaxonomy.usecase";
import { GetTrendingTagsUseCase } from "@/modules/taxonomy/application/GetTrendingTags.usecase";
import { CreateCategoryUseCase } from "@/modules/taxonomy/application/CreateCategory.usecase";
import { CreateVibeTaxonomyUseCase } from "@/modules/taxonomy/application/CreateVibeTaxonomy.usecase";
import { PrismaTagFollowRepository } from "@/modules/taxonomy/infrastructure/PrismaTagFollowRepository";
import { ToggleFollowTagUseCase } from "@/modules/taxonomy/application/ToggleFollowTag.usecase";

// QA Module
import { PrismaQARepository } from "@/modules/qa/infrastructure/PrismaQARepository";
import { AcceptSolutionUseCase, UnacceptSolutionUseCase } from "@/modules/qa/application/AcceptSolution.usecase";

// Outbox Module
import { PrismaOutboxRepository } from "@/modules/outbox/infrastructure/PrismaOutboxRepository";
import { TransactionalOutboxEventBus } from "@/modules/outbox/infrastructure/TransactionalOutboxEventBus";

// Messaging Module
import { PrismaMessagingRepository } from "@/modules/messaging/infrastructure/PrismaMessagingRepository";
import { StartConversationUseCase } from "@/modules/messaging/application/StartConversation.usecase";
import { SendMessageUseCase } from "@/modules/messaging/application/SendMessage.usecase";
import { GetConversationsUseCase, GetMessagesUseCase } from "@/modules/messaging/application/GetMessages.usecase";

// Trust & Safety Module
import { PrismaTrustSafetyRepository } from "@/modules/safety/infrastructure/PrismaTrustSafetyRepository";
import { BlockUserUseCase, UnblockUserUseCase, CreateReportUseCase } from "@/modules/safety/application/TrustSafetyUseCases";

// 0. Cache Singleton
export const cacheService = new RedisCacheService();

// 1. Instantiate Repositories (Inject DB)
export const outboxRepository = new PrismaOutboxRepository(prisma);
export const vibeRepository = new PrismaVibeRepository(prisma);
const engagementRepository = new PrismaEngagementRepository(prisma);
const notificationRepository = new PrismaNotificationRepository(prisma);
const authRepository = new PrismaAuthRepository(prisma);
const socialRepository = new PrismaSocialRepository(prisma);
const userInterestRepository = new PrismaUserInterestRepository(prisma);
const taxonomyRepository = new PrismaTaxonomyRepository(prisma);
const profileRepository = new PrismaProfileRepository(prisma);
export const messagingRepository = new PrismaMessagingRepository(prisma);
export const trustSafetyRepository = new PrismaTrustSafetyRepository(prisma);
export const tagFollowRepository = new PrismaTagFollowRepository(prisma);

export const authGateway = new BffAuthGateway(prisma);
export const eventBus = new TransactionalOutboxEventBus(outboxRepository);

// 2. Instantiate Use Cases (Inject Repositories & Cache)
// Safety
export const blockUserUseCase = new BlockUserUseCase(trustSafetyRepository);
export const unblockUserUseCase = new UnblockUserUseCase(trustSafetyRepository);
export const createReportUseCase = new CreateReportUseCase(trustSafetyRepository);

// Messaging
export const startConversationUseCase = new StartConversationUseCase(messagingRepository, trustSafetyRepository);
export const sendMessageUseCase = new SendMessageUseCase(messagingRepository, cacheService, trustSafetyRepository);
export const getConversationsUseCase = new GetConversationsUseCase(messagingRepository);
export const getMessagesUseCase = new GetMessagesUseCase(messagingRepository);

// Vibe
export const createVibeUseCase = new CreateVibeUseCase(vibeRepository, eventBus, cacheService);
export const generateFeedUseCase = new GenerateFeedUseCase(
  vibeRepository, 
  cacheService, 
  socialRepository, 
  userInterestRepository,
  tagFollowRepository
);
export const deleteVibeUseCase = new DeleteVibeUseCase(vibeRepository, eventBus, cacheService);
export const getPostByIdUseCase = new (require('@/modules/vibe/application/GetPostById.usecase').GetPostByIdUseCase)(vibeRepository);

// Taxonomy
export const toggleFollowTagUseCase = new ToggleFollowTagUseCase(tagFollowRepository, cacheService);

// Engagement
export const toggleLikeUseCase = new ToggleLikeUseCase(engagementRepository, eventBus);
export const toggleReGridUseCase = new ToggleReGridUseCase(engagementRepository, eventBus);
export const toggleBookmarkUseCase = new ToggleBookmarkUseCase(engagementRepository, eventBus);
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
export const getUserInterestsUseCase = new GetUserInterestsUseCase(userInterestRepository);
export const setUserInterestsUseCase = new SetUserInterestsUseCase(userInterestRepository, taxonomyRepository);

export const getSuggestedUsersUseCase = new GetSuggestedUsersUseCase(socialRepository, cacheService);
export const searchUsersUseCase = new SearchUsersUseCase(socialRepository);
export const getProfileUseCase = new GetProfileUseCase(profileRepository, cacheService);
export const updateProfileUseCase = new UpdateProfileUseCase(profileRepository, cacheService);
export const isFollowingUseCase = new IsFollowingUseCase(socialRepository);

// Taxonomy
export const getTaxonomyUseCase = new GetTaxonomyUseCase(taxonomyRepository, cacheService);
export const getTrendingTagsUseCase = new GetTrendingTagsUseCase(taxonomyRepository);
export const createCategoryUseCase = new CreateCategoryUseCase(taxonomyRepository);
export const createVibeTaxonomyUseCase = new CreateVibeTaxonomyUseCase(taxonomyRepository);

// QA Module
export const qaRepository = new PrismaQARepository(prisma);
export const acceptSolutionUseCase = new AcceptSolutionUseCase(qaRepository);
export const unacceptSolutionUseCase = new UnacceptSolutionUseCase(qaRepository);

// GitHub Module
import { CachedGitHubRepoRepository } from "@/modules/github/infrastructure/CachedGitHubRepoRepository";
export const gitHubRepoRepository = new CachedGitHubRepoRepository(cacheService, logger);

// Initialize Event Handlers
export const notificationEventHandler = new NotificationEventHandler(notificationRepository, eventBus);

