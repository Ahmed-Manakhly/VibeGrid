import { prisma } from "@/shared/infrastructure/prisma";
import { notificationRepository, cacheService, logger } from "@/shared/infrastructure/di-container";
import { NotificationType } from "@prisma/client";

export async function notifyMentionedUsers(
  text: string,
  creatorId: string,
  postId: string,
  commentId?: string
) {
  if (!text || typeof text !== "string") return;
  const mentionMatches = text.match(/@([a-zA-Z0-9_]+)/g);
  if (!mentionMatches || mentionMatches.length === 0) return;

  const rawUsernames = Array.from(new Set(mentionMatches.map((m) => m.slice(1).toLowerCase())));
  if (rawUsernames.length === 0) return;

  try {
    const mentionedUsers = await prisma.user.findMany({
      where: {
        username: { in: rawUsernames, mode: "insensitive" },
        id: { not: creatorId },
      },
      select: { id: true, username: true },
    });

    if (!mentionedUsers || mentionedUsers.length === 0) return;

    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { name: true, username: true },
    });

    for (const user of mentionedUsers) {
      try {
        const notif = await notificationRepository.create({
          userId: user.id,
          creatorId,
          type: NotificationType.MENTION,
          postId,
          commentId,
        });

        if (cacheService && typeof (cacheService as any).publish === "function") {
          const notifPayload = JSON.stringify({
            userId: user.id,
            notification: {
              id: notif.id,
              type: NotificationType.MENTION,
              userId: user.id,
              creatorId,
              creatorName: creator?.name,
              creatorUsername: creator?.username,
              postId,
              commentId,
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          });
          await (cacheService as any).publish("realtime:notification", notifPayload);
        }
        logger.info(`[notifyMentionedUsers] MENTION notification sent to @${user.username} (${user.id})`);
      } catch (err: any) {
        logger.warn("[notifyMentionedUsers] Failed to dispatch mention notification", {
          targetUserId: user.id,
          error: err?.message,
        });
      }
    }
  } catch (err: any) {
    logger.warn("[notifyMentionedUsers] Error processing mentions", { error: err?.message });
  }
}
