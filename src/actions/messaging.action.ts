"use server";

import { getCurrentSession } from "@/lib/auth/server";
import { getDbUserId } from "./user.action";
import {
  startConversationUseCase,
  sendMessageUseCase,
  getConversationsUseCase,
  getMessagesUseCase,
  deleteMessageUseCase,
  deleteConversationUseCase,
  logger,
} from "@/shared/infrastructure/di-container";

export async function getConversationsAction() {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized", conversations: [] };
    }
    const dbUserId = await getDbUserId();
    if (!dbUserId) {
      return { success: false, error: "User not synced", conversations: [] };
    }

    const conversations = await getConversationsUseCase.execute(dbUserId);
    return { success: true, conversations };
  } catch (error: any) {
    logger.error("Error in getConversationsAction", error);
    return { success: false, error: error.message || "Failed to fetch conversations", conversations: [] };
  }
}

export async function startConversationAction(targetUserId: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized" };
    }
    const currentUserId = await getDbUserId();
    if (!currentUserId) {
      return { success: false, error: "User not synced" };
    }

    const conversation = await startConversationUseCase.execute(currentUserId, targetUserId);
    return { success: true, conversation };
  } catch (error: any) {
    logger.error("Error in startConversationAction", error);
    return { success: false, error: error.message || "Failed to start conversation" };
  }
}

export async function getMessagesAction(conversationId: string, limit?: number, beforeCursor?: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized", messages: [], nextCursor: null };
    }
    const currentUserId = await getDbUserId();
    if (!currentUserId) {
      return { success: false, error: "User not synced", messages: [], nextCursor: null };
    }

    const result = await getMessagesUseCase.execute(conversationId, currentUserId, limit, beforeCursor);
    return { success: true, ...result };
  } catch (error: any) {
    logger.error("Error in getMessagesAction", error);
    return { success: false, error: error.message || "Failed to fetch messages", messages: [], nextCursor: null };
  }
}

export async function sendMessageAction(conversationId: string, content: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized" };
    }
    const senderId = await getDbUserId();
    if (!senderId) {
      return { success: false, error: "User not synced" };
    }

    const message = await sendMessageUseCase.execute({
      conversationId,
      senderId,
      content,
    });
    return { success: true, message };
  } catch (error: any) {
    logger.error("Error in sendMessageAction", error);
    return { success: false, error: error.message || "Failed to send message" };
  }
}

export async function deleteMessageAction(messageId: string, scope: 'FOR_ME' | 'FOR_EVERYONE') {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized" };
    }
    const currentUserId = await getDbUserId();
    if (!currentUserId) {
      return { success: false, error: "User not synced" };
    }

    await deleteMessageUseCase.execute(messageId, currentUserId, scope);
    return { success: true };
  } catch (error: any) {
    logger.error("Error in deleteMessageAction", error);
    return { success: false, error: error.message || "Failed to delete message" };
  }
}

export async function deleteConversationAction(conversationId: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized" };
    }
    const currentUserId = await getDbUserId();
    if (!currentUserId) {
      return { success: false, error: "User not synced" };
    }

    await deleteConversationUseCase.execute(conversationId, currentUserId);
    return { success: true };
  } catch (error: any) {
    logger.error("Error in deleteConversationAction", error);
    return { success: false, error: error.message || "Failed to delete conversation" };
  }
}
