import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { getDbUserId } from "@/actions/user.action";
import { getMessagesUseCase, sendMessageUseCase } from "@/shared/infrastructure/di-container";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const dbUserId = await getDbUserId();
    if (!dbUserId) {
      return NextResponse.json({ success: false, error: "User not synced" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const beforeCursor = searchParams.get("beforeCursor") || undefined;

    const result = await getMessagesUseCase.execute(conversationId, dbUserId, limit, beforeCursor);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const dbUserId = await getDbUserId();
    if (!dbUserId) {
      return NextResponse.json({ success: false, error: "User not synced" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: "Message content is required" }, { status: 400 });
    }

    const message = await sendMessageUseCase.execute({
      conversationId,
      senderId: dbUserId,
      content: content.trim(),
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

