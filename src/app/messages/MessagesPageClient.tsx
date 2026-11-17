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
  deleteMessageAction,
  deleteConversationAction,
  startConversationAction,
} from "@/actions/messaging.action";
import { getUserFollowingAction } from "@/actions/profile.action";
import { toast } from "@/components/ui/toast";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SendIcon,
  MessageSquareIcon,
  ArrowLeftIcon,
  Loader2Icon,
  Code2Icon,
  SmileIcon,
  Users,
  MessageCircle,
  MessagesSquare,
  Trash2Icon,
  MoreVerticalIcon,
  ImageIcon,
  PaperclipIcon,
  MicIcon,
  MicOffIcon,
  FileIcon,
  PlayIcon,
  PauseIcon,
  DownloadIcon,
  XIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { UnifiedTabsBar } from "@/components/UnifiedTabsBar";
import { uploadMediaAsset } from "@/lib/mediaClient";
import { ImageLightboxModal } from "@/modules/messaging/presentation/components/ImageLightboxModal";
import { ChatMessageParser, ChatMediaAttachment } from "@/modules/messaging/domain/ChatMessageParser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MESSAGES_MOBILE_TABS = [
  { value: "conversations", label: "Conversations", icon: Users },
  { value: "chat", label: "Chat", icon: MessageCircle },
];
import { formatDistanceToNow } from "date-fns";
import { CodeBlockViewer } from "@/modules/vibe/presentation/components/CodeBlockViewer";
import { PostContentValueObject } from "@/modules/vibe/domain/PostContentValueObject";

export function MessagesPageClient() {
  const { user: currentUser, isAuthenticated } = useSession();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("conversationId");

  const { latestDirectMessage, latestTypingSignal, onlineUsers, socket, setUnreadMessagesCount } = useRealtime();

  const [conversations, setConversations] = useState<any[]>([]);
  const [sidebarTab, setSidebarTab] = useState<"chats" | "online">("chats");
  const [followedUsers, setFollowedUsers] = useState<any[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as content grows, and reset height when content is cleared
  useEffect(() => {
    if (textareaRef.current) {
      if (!content) {
        textareaRef.current.style.height = "40px";
        return;
      }
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 160; // Max height limit before internal scrolling
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 40), maxHeight)}px`;
    }
  }, [content]);

  // Media & Code Block state
  const [showCodeComposer, setShowCodeComposer] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("typescript");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<ChatMediaAttachment | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox Modal state
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio playback state
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayAudio = (url: string) => {
    if (playingAudioUrl === url) {
      activeAudioRef.current?.pause();
      setPlayingAudioUrl(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }

    const audio = new Audio(url);
    activeAudioRef.current = audio;
    setPlayingAudioUrl(url);

    audio.onended = () => {
      setPlayingAudioUrl(null);
    };
    audio.onerror = () => {
      toast.error("Failed to play audio snippet");
      setPlayingAudioUrl(null);
    };

    audio.play().catch(() => {
      setPlayingAudioUrl(null);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isImageOnly = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = "";

    setUploadingMedia(true);
    try {
      const isImage = file.type.startsWith("image/");
      const result = await uploadMediaAsset({
        file,
        purpose: "post_attachment",
      });

      setPendingAttachment({
        type: isImage ? "image" : "file",
        url: result.publicUrl,
        name: file.name,
        size: file.size,
      });
      toast.success(isImage ? "Image uploaded" : "File attached");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploadingMedia(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 0) {
          const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
            type: "audio/webm",
          });
          setUploadingMedia(true);
          try {
            const result = await uploadMediaAsset({
              file: audioFile,
              purpose: "post_attachment",
            });
            setPendingAttachment({
              type: "voice",
              url: result.publicUrl,
              name: "Voice Note",
              duration: recordDuration,
            });
            toast.success("Voice note recorded");
          } catch (err: any) {
            toast.error("Failed to upload voice note");
          } finally {
            setUploadingMedia(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error("Microphone access denied or unavailable");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
  };

  // Deletion modals / state
  const [activeDeleteMessageId, setActiveDeleteMessageId] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);

  const handleDeleteConversation = async () => {
    if (!activeConversationId || deletingConversation) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this conversation? It will be cleared from your messages list.");
    if (!confirmDelete) return;

    setDeletingConversation(true);
    const res = await deleteConversationAction(activeConversationId);
    setDeletingConversation(false);

    if (res.success) {
      toast.success("Conversation cleared from your list");
      setConversations((prev) => prev.filter((c) => c.id !== activeConversationId));
      setActiveConversationId(null);
      setMessages([]);
      setMobileTab("conversations");
    } else {
      toast.error(res.error || "Could not delete conversation");
    }
  };

  const handleDeleteMessage = async (messageId: string, scope: "FOR_ME" | "FOR_EVERYONE") => {
    setDeletingMessage(true);
    const res = await deleteMessageAction(messageId, scope);
    setDeletingMessage(false);
    setActiveDeleteMessageId(null);

    if (res.success) {
      toast.success(scope === "FOR_EVERYONE" ? "Deleted for all participants" : "Deleted for you");
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } else {
      toast.error(res.error || "Could not delete message");
    }
  };

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

  // Load followed users for online roster
  const loadFollowedUsers = async () => {
    if (!currentUser?.id) return;
    setLoadingFollowed(true);
    const res = await getUserFollowingAction(currentUser.id);
    if (res.success && res.data) {
      setFollowedUsers(res.data);
    }
    setLoadingFollowed(false);
  };

  useEffect(() => {
    if (isAuthenticated && sidebarTab === "online") {
      loadFollowedUsers();
    }
  }, [isAuthenticated, sidebarTab, currentUser?.id]);

  const handleStartDirectChat = async (targetUserId: string) => {
    const res = await startConversationAction(targetUserId);
    if (res.success && res.conversation) {
      setConversations((prev) => {
        if (!prev.some((c) => c.id === res.conversation.id)) {
          return [res.conversation, ...prev];
        }
        return prev;
      });
      setActiveConversationId(res.conversation.id);
      setSidebarTab("chats");
      setMobileTab("chat");
    } else {
      toast.error(res.error || "Could not start chat");
    }
  };

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
        setConversations((prev) => {
          const next = prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c));
          const totalUnread = next.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
          setUnreadMessagesCount(totalUnread);
          return next;
        });
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
        const totalUnread = updated.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        setUnreadMessagesCount(totalUnread);
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
    const hasText = Boolean(content.trim());
    const hasCode = Boolean(codeSnippet.trim());
    const hasAttachment = Boolean(pendingAttachment);

    if ((!hasText && !hasCode && !hasAttachment) || !activeConversationId || sending) return;

    // Immediately stop typing signal when sending
    if (socket && otherParticipant?.id) {
      socket.emit("chat:typing", {
        conversationId: activeConversationId,
        recipientUserId: otherParticipant.id,
        isTyping: false,
      });
    }

    const payload = ChatMessageParser.format({
      text: content.trim(),
      codeBlock: hasCode ? { language: codeLanguage, code: codeSnippet.trim() } : undefined,
      attachment: pendingAttachment || undefined,
    });

    setContent("");
    setCodeSnippet("");
    setShowCodeComposer(false);
    setPendingAttachment(null);
    setSending(true);

    const res = await sendMessageAction(activeConversationId, payload);
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
    <div className="w-full flex flex-col space-y-4">
      <PageHeader
        eyebrow="DIRECT SIGNALS"
        title="Messages"
        subtitle="Real-time end-to-end encrypted direct messaging and code pairing."
        icon={MessagesSquare}
      />

      {/* Mobile/Tablet View Toggle Tabs (< lg) — Full width above columns */}
      <UnifiedTabsBar
        value={mobileTab}
        onValueChange={(val) => setMobileTab(val as "conversations" | "chat")}
        tabs={MESSAGES_MOBILE_TABS}
        className="lg:hidden mb-2"
      />

      <div className="w-full h-[calc(100vh-220px)] flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Conversations List Sidebar */}
        <div
          className={`w-full lg:w-80 shrink-0 flex flex-col border border-border/50 rounded-2xl bg-card/60 backdrop-blur-xl overflow-hidden ${
            mobileTab === "conversations" ? "flex flex-1 lg:flex-initial" : "hidden lg:flex"
          }`}
        >
          <div className="p-3 border-b flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base">Direct Signals</span>
            </div>
            {/* Sidebar Sub-tab Switcher: Conversations vs Online Roster */}
            <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setSidebarTab("chats")}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  sidebarTab === "chats"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageCircle className="size-3.5" />
                <span>Chats</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("online")}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  sidebarTab === "online"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="size-3.5" />
                <span>Online ({followedUsers.filter((u) => onlineUsers.has(u.id)).length})</span>
              </button>
            </div>
          </div>

        <div className="flex-1 overflow-y-auto divide-y">
          {sidebarTab === "online" ? (
            loadingFollowed ? (
              <div className="flex justify-center p-8">
                <Loader2Icon className="animate-spin text-muted-foreground" />
              </div>
            ) : followedUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Users className="size-8 stroke-[1.5] text-muted-foreground/60" />
                <p className="text-xs">You are not following any developers yet.</p>
              </div>
            ) : (
              followedUsers.map((dev) => {
                const isOnline = onlineUsers.has(dev.id);
                return (
                  <div
                    key={dev.id}
                    className="p-3 flex items-center justify-between gap-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <UserAvatar src={dev.image} name={dev.name} className="size-9 ring-1 ring-border" />
                        {isOnline && (
                          <span className="absolute top-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-sm" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate block">
                          {dev.name || dev.username}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground font-mono truncate">
                            @{dev.username}
                          </span>
                          {isOnline && (
                            <span className="text-[9px] text-emerald-500 font-medium font-mono">
                              ● online
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs rounded-lg shrink-0 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleStartDirectChat(dev.id)}
                    >
                      Message
                    </Button>
                  </div>
                );
              })
            )
          ) : (
            loadingConversations ? (
              <div className="flex justify-center p-8">
                <Loader2Icon className="animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                <MessageSquareIcon className="size-10 stroke-[1.5] text-muted-foreground/60" />
                <p className="text-sm max-w-xs leading-relaxed">
                  No conversations yet. Start messaging developers from their profiles or the Online tab!
                </p>
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
                  className={`w-full p-3.5 flex items-center gap-3.5 text-left transition-all relative border-l-4 ${
                    isActive 
                      ? "bg-accent/15 border-l-primary shadow-sm" 
                      : "border-l-transparent hover:bg-muted/40"
                  }`}
                >
                  <div className="relative shrink-0">
                    <UserAvatar src={other?.image} name={other?.name} className="size-11 ring-1 ring-border" />
                    {other?.id && onlineUsers.has(other.id) && (
                      <span className="absolute top-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background shadow-sm" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline gap-1">
                      <span className={`text-sm truncate ${isActive ? "font-bold text-foreground" : "font-semibold text-foreground/90"}`}>
                        {other?.name || other?.username || "Developer"}
                      </span>
                      {conv.latestMessage && (
                        <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                          {formatDistanceToNow(new Date(conv.latestMessage.createdAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1 gap-2">
                      <p className={`text-xs truncate ${hasUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {conv.latestMessage?.content || "Started a conversation"}
                      </p>
                      {hasUnread && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ))}
        </div>
      </div>

      {/* Active Conversation View */}
      <div
        className={`flex-1 flex flex-col border border-border/50 rounded-2xl bg-card/60 backdrop-blur-xl overflow-hidden ${
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
                <Link href={`/profile/${otherParticipant.username || otherParticipant.id}`} className="flex items-center gap-3 group min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <UserAvatar src={otherParticipant.image} name={otherParticipant.name} className="size-10 group-hover:opacity-80 transition-opacity ring-1 ring-border" />
                    {otherParticipant.id && onlineUsers.has(otherParticipant.id) && (
                      <span className="absolute top-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background shadow-sm" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-semibold text-sm group-hover:underline truncate max-w-[150px] sm:max-w-none">
                        {otherParticipant.name || otherParticipant.username || "Developer"}
                      </h3>
                      {otherParticipant.id && onlineUsers.has(otherParticipant.id) && (
                        <span className="text-[10px] font-mono text-emerald-500 font-medium shrink-0">● online</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">@{otherParticipant.username}</p>
                  </div>
                </Link>
              )}

              {/* Conversation Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={handleDeleteConversation}
                  disabled={deletingConversation}
                  title="Delete conversation for me"
                >
                  {deletingConversation ? <Loader2Icon className="size-4 animate-spin" /> : <Trash2Icon className="size-4" />}
                </Button>
              </div>
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

              {/* Persistent Identity Header Card (always rendered at top of history) */}
              {otherParticipant && (
                <div className="flex flex-col items-center p-5 rounded-2xl bg-muted/20 border border-border/40 max-w-sm mx-auto w-full my-2 text-center shadow-xs">
                  <div className="relative mb-2">
                    <UserAvatar src={otherParticipant.image} name={otherParticipant.name} className="size-14 ring-2 ring-primary/20" />
                    {otherParticipant.id && onlineUsers.has(otherParticipant.id) && (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background shadow-sm" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{otherParticipant.name || otherParticipant.username}</h4>
                  <p className="text-[11px] text-muted-foreground font-mono mb-1.5">@{otherParticipant.username}</p>
                  {otherParticipant.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 text-center mb-3 px-2">{otherParticipant.bio}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Link href={`/profile/${otherParticipant.username || otherParticipant.id}`}>
                      <Button size="sm" variant="outline" className="text-xs h-7 px-3 rounded-lg font-medium">
                        View Profile
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 px-2.5 text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={() => {
                        setActiveConversationId(null);
                        setDeletingConversation(false);
                      }}
                    >
                      Hide Room
                    </Button>
                  </div>
                </div>
              )}

              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2Icon className="animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-4 my-auto space-y-2">
                  <p className="text-xs text-muted-foreground">
                    This is the beginning of your direct conversation with {otherParticipant?.name || "this developer"}.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  const parsed = ChatMessageParser.parse(msg.content);
                  const isMenuOpen = activeDeleteMessageId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group relative ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%]">
                        {/* Options button on left if it's Me */}
                        {isMe && (
                          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground hover:text-foreground rounded-full"
                              onClick={() => setActiveDeleteMessageId((prev) => (prev === msg.id ? null : msg.id))}
                              title="Message options"
                            >
                              <MoreVerticalIcon className="size-3.5" />
                            </Button>
                            {isMenuOpen && (
                              <div className="absolute right-0 bottom-full mb-1 z-30 min-w-[140px] p-1 rounded-xl bg-card border border-border shadow-lg backdrop-blur-md flex flex-col gap-0.5 text-xs">
                                {!msg.isRead && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(msg.id, "FOR_EVERYONE")}
                                    className="text-left px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive font-medium transition-colors"
                                  >
                                    Delete for everyone
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id, "FOR_ME")}
                                  className="text-left px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                                >
                                  Delete for me
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm break-words flex-1 min-w-0 max-w-full flex flex-col gap-2 overflow-hidden [overflow-wrap:anywhere] ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-foreground rounded-bl-none"
                          }`}
                        >
                          {/* Image Attachment */}
                          {parsed.attachment?.type === "image" && (
                            <div className="rounded-xl overflow-hidden cursor-pointer group/img relative my-1 max-w-full">
                              <img
                                src={parsed.attachment.url}
                                alt="attachment"
                                onClick={() => setLightboxImageUrl(parsed.attachment!.url)}
                                className="max-h-60 max-w-full w-auto rounded-lg object-contain hover:opacity-95 transition-opacity"
                              />
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="secondary"
                                  className="size-7 rounded-lg bg-background/80 backdrop-blur-sm shadow"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxImageUrl(parsed.attachment!.url);
                                  }}
                                  title="View full image"
                                >
                                  <ImageIcon className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Voice Note Attachment */}
                          {parsed.attachment?.type === "voice" && (
                            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-background/20 backdrop-blur-sm border border-foreground/10 my-1 max-w-full overflow-hidden">
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                onClick={() => togglePlayAudio(parsed.attachment!.url)}
                                className="size-8 rounded-full bg-primary text-primary-foreground hover:opacity-90 shrink-0"
                              >
                                {playingAudioUrl === parsed.attachment.url ? (
                                  <PauseIcon className="size-4" />
                                ) : (
                                  <PlayIcon className="size-4 ml-0.5" />
                                )}
                              </Button>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold block truncate">Voice Note</span>
                                <span className="text-[10px] opacity-75 font-mono">
                                  {parsed.attachment.duration ? `${parsed.attachment.duration}s` : "Audio Note"}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* File Attachment */}
                          {parsed.attachment?.type === "file" && (
                            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-background/20 backdrop-blur-sm border border-foreground/10 my-1 max-w-full overflow-hidden">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileIcon className="size-4 shrink-0" />
                                <span className="text-xs truncate font-medium">
                                  {parsed.attachment.name || "Attachment"}
                                </span>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(parsed.attachment!.url, "_blank")}
                                className="h-7 px-2 text-xs gap-1 rounded-lg shrink-0 hover:bg-background/40"
                              >
                                <DownloadIcon className="size-3.5" />
                                <span className="text-[11px]">Download</span>
                              </Button>
                            </div>
                          )}

                          {/* Message Text */}
                          {parsed.text && (
                            <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed max-w-full overflow-hidden">
                              {parsed.text}
                            </div>
                          )}

                          {/* Code Block with Syntax Highlighting */}
                          {parsed.codeBlock && (
                            <div className="my-1 rounded-lg overflow-x-auto text-left not-prose max-w-full">
                              <CodeBlockViewer
                                language={parsed.codeBlock.language}
                                code={parsed.codeBlock.code}
                              />
                            </div>
                          )}
                        </div>

                        {/* Options button on right if from counterparty */}
                        {!isMe && (
                          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground hover:text-foreground rounded-full"
                              onClick={() => setActiveDeleteMessageId((prev) => (prev === msg.id ? null : msg.id))}
                              title="Message options"
                            >
                              <MoreVerticalIcon className="size-3.5" />
                            </Button>
                            {isMenuOpen && (
                              <div className="absolute left-0 bottom-full mb-1 z-30 min-w-[130px] p-1 rounded-xl bg-card border border-border shadow-lg backdrop-blur-md flex flex-col gap-0.5 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id, "FOR_ME")}
                                  className="text-left px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                                >
                                  Delete for me
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                        {isMe && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {msg.isRead ? "✓✓ read" : "✓ sent"}
                          </span>
                        )}
                      </div>
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
            <form onSubmit={handleSend} className="p-3 border-t bg-card/40 backdrop-blur-md flex flex-col gap-2">
              {/* Pending Attachment Preview Banner */}
              {pendingAttachment && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/60 border border-border/60 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {pendingAttachment.type === "image" && <ImageIcon className="size-4 text-primary shrink-0" />}
                    {pendingAttachment.type === "voice" && <MicIcon className="size-4 text-emerald-500 shrink-0" />}
                    {pendingAttachment.type === "file" && <FileIcon className="size-4 text-blue-500 shrink-0" />}
                    <span className="font-medium truncate">{pendingAttachment.name || "Attachment"}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-destructive rounded-full"
                    onClick={() => setPendingAttachment(null)}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </div>
              )}

              {/* Code Snippet Composer Tray */}
              {showCodeComposer && (
                <div className="border border-border/70 rounded-xl p-2.5 bg-background/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Code2Icon className="size-3.5 text-primary" />
                      <span className="text-xs font-mono font-semibold uppercase text-muted-foreground">Code Snippet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                        <SelectTrigger className="w-[125px] h-7 text-xs bg-background border-border/50 font-mono rounded-lg">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border/50 font-mono">
                          <SelectItem value="typescript">TypeScript</SelectItem>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="tsx">TSX</SelectItem>
                          <SelectItem value="jsx">JSX</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="sql">SQL</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="bash">Bash / Shell</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="css">CSS</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="go">Go</SelectItem>
                          <SelectItem value="csharp">C#</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                          <SelectItem value="php">PHP</SelectItem>
                          <SelectItem value="rust">Rust</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-foreground rounded-full"
                        onClick={() => {
                          setShowCodeComposer(false);
                          setCodeSnippet("");
                        }}
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <textarea
                    placeholder="// Paste your code snippet here..."
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    className="w-full min-h-[90px] font-mono text-xs bg-background/90 border border-border/40 rounded-lg p-2.5 resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>
              )}

              {/* Feature Action Bar (Code, Image, File, Voice & Emoji Toolbar) */}
              <div className="flex items-center justify-between gap-1 border-b border-border/40 pb-2">
                <div className="flex items-center gap-1">
                  {/* Code snippet toggle */}
                  <Button
                    type="button"
                    variant={showCodeComposer ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setShowCodeComposer((prev) => !prev)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20 h-8 px-2.5 text-xs gap-1.5 rounded-lg transition-colors font-mono"
                    title="Toggle code snippet composer"
                  >
                    <Code2Icon className="size-3.5" />
                    <span className="font-mono text-[11px]">Code</span>
                  </Button>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Image attachment */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploadingMedia}
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "image/*";
                        fileInputRef.current.click();
                      }
                    }}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20 h-8 px-2.5 text-xs gap-1.5 rounded-lg transition-colors font-mono"
                    title="Share image"
                  >
                    <ImageIcon className="size-3.5" />
                    <span className="font-mono text-[11px]">Image</span>
                  </Button>

                  {/* File attachment */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploadingMedia}
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "*/*";
                        fileInputRef.current.click();
                      }
                    }}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20 h-8 px-2.5 text-xs gap-1.5 rounded-lg transition-colors font-mono"
                    title="Attach file"
                  >
                    <PaperclipIcon className="size-3.5" />
                    <span className="font-mono text-[11px]">File</span>
                  </Button>

                  {/* Voice note recorder button */}
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "ghost"}
                    size="sm"
                    disabled={uploadingMedia}
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className={`h-8 px-2.5 text-xs gap-1.5 rounded-lg transition-colors font-mono ${
                      isRecording ? "animate-pulse" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    }`}
                    title={isRecording ? "Stop recording voice note" : "Record voice note"}
                  >
                    {isRecording ? <MicOffIcon className="size-3.5" /> : <MicIcon className="size-3.5" />}
                    <span className="font-mono text-[11px]">
                      {isRecording ? `${recordDuration}s` : "Voice"}
                    </span>
                  </Button>

                  {/* Emoji Picker Dropdown */}
                  <div className="relative" ref={emojiPickerRef}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20 h-8 px-2.5 text-xs gap-1.5 rounded-lg transition-colors font-mono"
                      title="Insert emoji"
                    >
                      <SmileIcon className="size-3.5" />
                      <span className="font-mono text-[11px]">Emoji</span>
                    </Button>
                    {showEmojiPicker && (
                      <div className="fixed sm:absolute bottom-20 sm:bottom-full left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 mb-2 z-50 w-[calc(100vw-2rem)] max-w-xs sm:w-72 p-3 rounded-2xl bg-card/95 border border-border/80 shadow-2xl backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
                        <div className="text-[11px] font-mono font-semibold text-muted-foreground mb-2 px-1 flex items-center justify-between">
                          <span>Developer Reactions & Emojis</span>
                          <span className="text-[10px] text-muted-foreground/70">Click to insert</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 text-xl max-h-56 overflow-y-auto pr-1">
                          {[
                            "😀", "😃", "😄", "😁", "😆", "😂", "🤣",
                            "😊", "😇", "🙂", "🙃", "😉", "😌", "😍",
                            "🥰", "😘", "😎", "🤓", "🧐", "🤔", "🫡",
                            "🤫", "🤐", "😐", "😑", "😶", "🙄", "😬",
                            "😮‍💨", "🤥", "😌", "😴", "😷", "🤒", "🤕",
                            "🔥", "✨", "🚀", "⚡", "💯", "🎉", "👏",
                            "🙌", "👍", "👎", "👊", "✊", "🤛", "🤜",
                            "🤝", "🙏", "💪", "❤️", "🧡", "💛", "💚",
                            "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️",
                            "💻", "⌨️", "🖥️", "📱", "💾", "💿", "🕹️",
                            "🛠️", "🔧", "🔨", "⚙️", "🧪", "🧫", "🧬",
                            "☕", "🍵", "🍺", "🍻", "🍕", "🍔", "🍿",
                            "🐛", "🐞", "🐜", "🕷️", "🕸️", "🚨", "⚠️",
                            "✅", "❌", "❓", "❗", "💡", "🧠", "🎯"
                          ].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setContent((prev) => prev + emoji);
                                setShowEmojiPicker(false);
                                textareaRef.current?.focus();
                              }}
                              className="p-1 rounded-lg hover:bg-muted hover:scale-125 transition-all text-center flex items-center justify-center size-8"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-muted-foreground/70 font-mono hidden sm:inline">
                  {uploadingMedia ? "Uploading asset..." : "Enter to send • Shift+Enter for new line"}
                </span>
              </div>

              {/* Textarea Row with Submit Button */}
              <div className="flex items-end gap-2 w-full">
                <textarea
                  ref={textareaRef}
                  value={content}
                  rows={1}
                  onChange={(e) => handleTypingChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if ((content.trim() || codeSnippet.trim() || pendingAttachment) && !sending && !uploadingMedia) {
                        handleSend(e);
                      }
                    }
                  }}
                  placeholder="Write a message... (supports rich media & code)"
                  maxLength={2000}
                  className="flex-1 w-full bg-background/50 border border-input rounded-xl px-3 py-2 text-sm leading-relaxed resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary overflow-y-auto min-h-[40px] max-h-[160px] scrollbar-thin transition-all"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={(!content.trim() && !codeSnippet.trim() && !pendingAttachment) || sending || uploadingMedia}
                  className="size-10 rounded-xl shrink-0 btn-gradient"
                >
                  {sending || uploadingMedia ? (
                    <Loader2Icon className="animate-spin size-4" />
                  ) : (
                    <SendIcon className="size-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 sm:p-8 text-center gap-3">
            <MessageSquareIcon className="size-12 stroke-[1.5] text-muted-foreground/60" />
            <p className="text-sm max-w-xs leading-relaxed">
              Select a conversation or start a new message
            </p>
          </div>
        )}
      </div>
    </div>

    {/* Image Lightbox Modal */}
    <ImageLightboxModal
      isOpen={Boolean(lightboxImageUrl)}
      imageUrl={lightboxImageUrl}
      onClose={() => setLightboxImageUrl(null)}
    />
    </div>
  );
}
