import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { getDbUserId } from "@/actions/user.action";
import {
  getConversationsUseCase,
  startConversationUseCase,
  sendMessageUseCase,
} from "@/shared/infrastructure/di-container";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const cursor = searchParams.get("cursor") || undefined;

    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const dbUserId = await getDbUserId();
    if (!dbUserId) {
      return NextResponse.json({ success: false, error: "User not synced" }, { status: 401 });
    }

    const result = await getConversationsUseCase.execute(dbUserId, limit, cursor);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const dbUserId = await getDbUserId();
    if (!dbUserId) {
      return NextResponse.json({ success: false, error: "User not synced" }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, content } = body;

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "targetUserId is required" }, { status: 400 });
    }

    const conversation = await startConversationUseCase.execute(dbUserId, targetUserId);

    let initialMessage = null;
    if (content?.trim()) {
      initialMessage = await sendMessageUseCase.execute({
        conversationId: conversation.id,
        senderId: dbUserId,
        content: content.trim(),
      });
    }

    return NextResponse.json({ success: true, conversation, message: initialMessage }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start conversation" },
      { status: 500 }
    );
  }
}

