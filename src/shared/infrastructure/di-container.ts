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

// 1. Instantiate Repositories (Inject DB)
const vibeRepository = new PrismaVibeRepository(prisma);
const engagementRepository = new PrismaEngagementRepository(prisma);
const notificationRepository = new PrismaNotificationRepository(prisma);

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

// Initialize Event Handlers
export const notificationEventHandler = new NotificationEventHandler(notificationRepository);
