"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/components/auth/SessionProvider";
import { useRealtime } from "@/shared/infrastructure/socket/RealtimeProvider";
import {
  getConversationsAction,
  getMessagesAction,
  sendMessageAction,
} from "@/actions/messaging.action";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SendIcon, MessageSquareIcon, ArrowLeftIcon, Loader2Icon, Code2Icon, SmileIcon, Users, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CodeBlockViewer } from "@/modules/vibe/presentation/components/CodeBlockViewer";
import { PostContentValueObject } from "@/modules/vibe/domain/PostContentValueObject";

export function MessagesPageClient() {
  const { user: currentUser, isAuthenticated } = useSession();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("conversationId");

  const { latestDirectMessage, latestTypingSignal, onlineUsers, socket } = useRealtime();

  const [conversations, setConversations] = useState<any[]>([]);
  const [mobileTab, setMobileTab] = useState<"conversations" | "chat">("conversations");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConvId);

  // Sync mobile tab if an initial conversation ID was passed in query params
  useEffect(() => {
    if (initialConvId) {
      setMobileTab("chat");
    }
  }, [initialConvId]);
  const [messages, setMessages] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Load conversations list
  const loadConversations = async () => {
    setLoadingConversations(true);
    const res = await getConversationsAction();
    if (res.success && res.conversations) {
      setConversations(res.conversations);
      if (!activeConversationId && res.conversations.length > 0) {
        setActiveConversationId(res.conversations[0].id);
      }
    }
    setLoadingConversations(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversationId) return;

    async function loadMessages() {
      setLoadingMessages(true);
      const res = await getMessagesAction(activeConversationId as string);
      if (res.success) {
        setMessages(res.messages || []);
        setNextCursor(res.nextCursor || null);
        // Clear unread indicator locally for active conversation
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
      setLoadingMessages(false);
    }

    loadMessages();
  }, [activeConversationId]);

  // Scroll to bottom on initial message load or new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Handle incoming realtime direct messages
  useEffect(() => {
    if (!latestDirectMessage) return;

    const { conversationId, messageId, senderId, senderName, content: msgContent, createdAt } = latestDirectMessage;

    // If message is for currently open conversation, append to list
    if (conversationId === activeConversationId) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === messageId)) return prev;
        return [
          ...prev,
          {
            id: messageId,
            conversationId,
            senderId,
            content: msgContent,
            createdAt: new Date(createdAt),
            sender: { id: senderId, name: senderName, username: senderName, image: null },
          },
        ];
      });
    }

    // Update conversation list item
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conversationId);
      if (idx !== -1) {
        const updated = [...prev];
        const conv = updated[idx];
        const isCurrentActive = conversationId === activeConversationId;
        updated[idx] = {
          ...conv,
          updatedAt: new Date(createdAt),
          latestMessage: { id: messageId, content: msgContent, createdAt: new Date(createdAt), senderId },
          unreadCount: isCurrentActive ? 0 : (conv.unreadCount || 0) + 1,
        };
        // Re-sort list by newest update
        return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } else {
        // Refresh full conversation list if new conversation appeared
        loadConversations();
        return prev;
      }
    });
  }, [latestDirectMessage, activeConversationId]);

  // Handle typing signal from socket
  useEffect(() => {
    if (!latestTypingSignal || !activeConversationId) return;

    if (
      latestTypingSignal.conversationId === activeConversationId &&
      latestTypingSignal.userId !== currentUser?.id
    ) {
      setIsRecipientTyping(latestTypingSignal.isTyping);

      if (latestTypingSignal.isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsRecipientTyping(false);
        }, 3500);
      }
    }
  }, [latestTypingSignal, activeConversationId, currentUser?.id]);

  // Clean up typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    };
  }, []);

  // Emit typing event to socket
  const handleTypingChange = (newVal: string) => {
    setContent(newVal);

    if (!socket || !activeConversationId || !otherParticipant?.id) return;

    // Emit typing true immediately on first keystroke
    socket.emit("chat:typing", {
      conversationId: activeConversationId,
      recipientUserId: otherParticipant.id,
      isTyping: true,
    });

    // Debounce stop typing after 2.5 seconds of inactivity
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      socket.emit("chat:typing", {
        conversationId: activeConversationId,
        recipientUserId: otherParticipant.id,
        isTyping: false,
      });
    }, 2500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeConversationId || sending) return;

    // Immediately stop typing signal when sending
    if (socket && otherParticipant?.id) {
      socket.emit("chat:typing", {
        conversationId: activeConversationId,
        recipientUserId: otherParticipant.id,
        isTyping: false,
      });
    }

    const tempContent = content;
    setContent("");
    setSending(true);

    const res = await sendMessageAction(activeConversationId, tempContent);
    setSending(false);

    if (res.success && res.message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });

      // Update conversations sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                updatedAt: new Date(),
                latestMessage: res.message,
              }
            : c
        )
      );
    }
  };

  const handleLoadOlder = async () => {
    if (!activeConversationId || !nextCursor || loadingMore) return;
    setLoadingMore(true);

    const res = await getMessagesAction(activeConversationId, 20, nextCursor);
    if (res.success) {
      setMessages((prev) => [...(res.messages || []), ...prev]);
      setNextCursor(res.nextCursor || null);
    }
    setLoadingMore(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <MessageSquareIcon className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Sign in to view messages</h2>
      </div>
    );
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const otherParticipant = activeConversation?.participants.find(
    (p: any) => p.userId !== currentUser?.id
  )?.user;

  return (
    <div className="w-full h-[calc(100vh-80px)] p-2 sm:p-4 flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Mobile/Tablet View Toggle Tabs (< lg) */}
      <div className="lg:hidden w-full shrink-0">
        <Tabs
          value={mobileTab}
          onValueChange={(val) => setMobileTab(val as "conversations" | "chat")}
          className="w-full"
        >
          <TabsList className="w-full flex items-center justify-start flex-wrap border-b border-border/50 bg-transparent p-0 rounded-none h-auto gap-x-4 sm:gap-x-6 gap-y-1">
            <TabsTrigger
              value="conversations"
              className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-0.5 text-xs sm:text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
            >
              <Users className="size-3.5 sm:size-4 shrink-0" />
              <span>Conversations</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-0.5 text-xs sm:text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
            >
              <MessageCircle className="size-3.5 sm:size-4 shrink-0" />
              <span>Chat</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversations List Sidebar */}
      <div
        className={`w-full lg:w-80 shrink-0 flex flex-col border rounded-xl bg-card overflow-hidden ${
          mobileTab === "conversations" ? "flex flex-1 lg:flex-initial" : "hidden lg:flex"
        }`}
      >
        <div className="p-4 border-b font-bold text-lg flex items-center justify-between">
          <span>Messages</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y">
          {loadingConversations ? (
            <div className="flex justify-center p-8">
              <Loader2Icon className="animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No conversations yet. Start messaging developers from their profiles!
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.participants.find((p: any) => p.userId !== currentUser?.id)?.user;
              const isActive = conv.id === activeConversationId;
              const hasUnread = conv.unreadCount && conv.unreadCount > 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setMobileTab("chat");
                  }}
                  className={`w-full p-3 flex items-center gap-3 text-left transition hover:bg-accent/50 ${
                    isActive ? "bg-accent" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <UserAvatar src={other?.image} name={other?.name} className="size-10" />
                    {other?.id && onlineUsers.has(other.id) && (
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-sm truncate">{other?.name || other?.username || "Developer"}</span>
                      {conv.latestMessage && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                          {formatDistanceToNow(new Date(conv.latestMessage.createdAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-xs truncate ${hasUnread ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                        {conv.latestMessage?.content || "Started a conversation"}
                      </p>
                      {hasUnread && (
                        <span className="size-2 rounded-full bg-primary shrink-0 ml-2" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation View */}
      <div
        className={`flex-1 flex flex-col border rounded-xl bg-card overflow-hidden ${
          mobileTab === "chat" ? "flex" : "hidden lg:flex"
        }`}
      >
        {activeConversationId ? (
          <>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden size-8"
                onClick={() => setMobileTab("conversations")}
              >
                <ArrowLeftIcon className="size-4" />
              </Button>
              {otherParticipant && (
                <Link href={`/profile/${otherParticipant.username || otherParticipant.id}`} className="flex items-center gap-3 group">
                  <div className="relative shrink-0">
                    <UserAvatar src={otherParticipant.image} name={otherParticipant.name} className="size-9 group-hover:opacity-80 transition-opacity" />
                    {otherParticipant.id && onlineUsers.has(otherParticipant.id) && (
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm group-hover:underline">{otherParticipant.name || otherParticipant.username || "Developer"}</h3>
                      {otherParticipant.id && onlineUsers.has(otherParticipant.id) && (
                        <span className="text-[10px] font-mono text-emerald-500 font-medium">● online</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">@{otherParticipant.username}</p>
                  </div>
                </Link>
              )}
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {nextCursor && (
                <div className="flex justify-center my-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadOlder}
                    disabled={loadingMore}
                    className="text-xs"
                  >
                    {loadingMore ? <Loader2Icon className="animate-spin size-3 mr-1" /> : null}
                    Load older messages
                  </Button>
                </div>
              )}

              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2Icon className="animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm my-12">
                  Say hello to {otherParticipant?.name || "this developer"}! 👋
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  const parsed = PostContentValueObject.parse(msg.content);
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2 text-sm break-words ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted text-foreground rounded-bl-none"
                        }`}
                      >
                        {parsed.text && (
                          <div className="whitespace-pre-wrap">{parsed.text}</div>
                        )}
                        {parsed.codeBlock && (
                          <div className="my-2 rounded-lg overflow-hidden text-left not-prose">
                            <CodeBlockViewer
                              language={parsed.codeBlock.language}
                              code={parsed.codeBlock.code}
                            />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator Pill */}
              {isRecipientTyping && otherParticipant && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1 animate-pulse">
                  <UserAvatar src={otherParticipant.image} name={otherParticipant.name} className="size-5 shrink-0" />
                  <div className="flex items-center gap-1 bg-muted/60 px-3 py-1.5 rounded-full border border-border/40">
                    <span className="italic font-medium">{otherParticipant.name || "Developer"} is typing</span>
                    <span className="flex gap-0.5 ml-1">
                      <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="size-1 rounded-full bg-primary animate-bounce" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSend} className="p-3 border-t flex gap-2 items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setContent((prev) => prev ? `${prev}\n\`\`\`typescript\n// your code snippet here\n\`\`\`\n` : "```typescript\n// your code snippet here\n```\n")}
                className="text-muted-foreground hover:text-primary size-9 shrink-0"
                title="Insert code snippet"
              >
                <Code2Icon className="size-4" />
              </Button>

              {/* Emoji Picker Dropdown */}
              <div className="relative" ref={emojiPickerRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="text-muted-foreground hover:text-primary size-9 shrink-0"
                  title="Insert emoji"
                >
                  <SmileIcon className="size-4" />
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-64 p-2 rounded-xl bg-card border border-border/80 shadow-2xl backdrop-blur-md animate-in fade-in-50 zoom-in-95">
                    <div className="text-[11px] font-mono font-semibold text-muted-foreground mb-1.5 px-1">
                      Quick Reactions & Emojis
                    </div>
                    <div className="grid grid-cols-6 gap-1 text-lg">
                      {["😀", "🔥", "🚀", "💻", "🎉", "👍", "❤️", "⚡", "✨", "🙌", "🐛", "💯", "👀", "🫡", "🤝", "💡", "☕", "✅"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setContent((prev) => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="p-1.5 rounded-lg hover:bg-muted text-center transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Input
                value={content}
                onChange={(e) => handleTypingChange(e.target.value)}
                placeholder="Write a message... (supports ```lang code blocks)"
                maxLength={2000}
                className="flex-1 text-sm focus-visible:ring-1"
              />
              <Button type="submit" size="icon" disabled={!content.trim() || sending} className="size-9 shrink-0">
                {sending ? <Loader2Icon className="animate-spin size-4" /> : <SendIcon className="size-4" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageSquareIcon className="size-12 stroke-[1.5]" />
            <p className="text-sm">Select a conversation or start a new message</p>
          </div>
        )}
      </div>
    </div>
  );
}
