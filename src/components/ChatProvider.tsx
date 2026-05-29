"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { MessageSquare } from "lucide-react";

const ChatDrawer = dynamic(() => import("./ChatDrawer"), { ssr: false });
import { getMessagesBySession } from "@/lib/actions";
import ShareWidget from "./ShareWidget";

interface ChatContextType {
  isChatOpen: boolean;
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  initialMessage: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "anonymous";
  let sid = localStorage.getItem("chat_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("chat_session_id", sid);
  }
  return sid;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId, setSessionId] = useState("anonymous");
  const lastSeenCountRef = useRef(0);
  const pathname = usePathname();

  const isAdminRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/login") || pathname?.startsWith("/auth");

  // Init session ID client-side
  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  // Poll for unread admin replies while chat is CLOSED
  const checkUnread = useCallback(async () => {
    if (sessionId === "anonymous" || isChatOpen) return;
    try {
      const data = await getMessagesBySession(sessionId);
      if (!data || data.length === 0) return;
      // Count admin replies received after last seen
      const adminReplies = data.filter((m: { is_admin_reply: boolean }) => m.is_admin_reply).length;
      const newReplies = Math.max(0, adminReplies - lastSeenCountRef.current);
      setUnreadCount(newReplies);
    } catch { /* ignore */ }
  }, [sessionId, isChatOpen]);

  useEffect(() => {
    if (isAdminRoute || sessionId === "anonymous") return;
    const interval = setInterval(checkUnread, 5000);
    checkUnread();
    return () => clearInterval(interval);
  }, [isAdminRoute, sessionId, checkUnread]);

  const openChat = (message: string = "") => {
    setInitialMessage(message);
    setIsChatOpen(true);
    // Mark all as seen
    getMessagesBySession(sessionId).then((data) => {
      if (data) {
        const adminReplies = data.filter((m: { is_admin_reply: boolean }) => m.is_admin_reply).length;
        lastSeenCountRef.current = adminReplies;
        setUnreadCount(0);
      }
    }).catch(() => {});
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setTimeout(() => setInitialMessage(""), 300);
    // Refresh seen count on close
    getMessagesBySession(sessionId).then((data) => {
      if (data) {
        const adminReplies = data.filter((m: { is_admin_reply: boolean }) => m.is_admin_reply).length;
        lastSeenCountRef.current = adminReplies;
        setUnreadCount(0);
      }
    }).catch(() => {});
  };

  return (
    <ChatContext.Provider value={{ isChatOpen, openChat, closeChat, initialMessage }}>
      {children}
      <ChatDrawer />

      {/* Share Widget — only on non-admin pages */}
      {!isAdminRoute && <ShareWidget />}

      {/* Floating Chat Button — only on public pages, not admin */}
      {!isAdminRoute && (
        <button
          onClick={() => openChat()}
          aria-label="Open support chat"
          className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all duration-200 hover:scale-105 z-40"
        >
          <MessageSquare size={26} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
