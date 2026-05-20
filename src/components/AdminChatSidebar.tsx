"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { sendMessage, getChatThreads, getMessagesBySession } from "@/lib/actions";
import { Send, MessageSquare, RefreshCw, Phone, X, ChevronLeft, Circle } from "lucide-react";

type Thread = {
  session_id: string;
  name: string;
  email: string;
  last_message: string;
  updated_at: string;
  has_unread: boolean;
};

type Message = {
  id: string;
  session_id: string;
  name: string;
  email: string;
  content: string;
  is_admin_reply: boolean;
  created_at: string;
};

export default function AdminChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMsgCountRef = useRef(0);
  const lastThreadCountRef = useRef(0);

  // ── Poll thread list every 5 seconds ─────────────────────────────────────
  const fetchThreads = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoadingThreads(true);
    try {
      const data = await getChatThreads();
      if (data.length !== lastThreadCountRef.current) {
        lastThreadCountRef.current = data.length;
        setThreads(data as Thread[]);
      }
    } catch (e) {
      console.error("Thread poll error:", e);
    }
    if (showSpinner) setLoadingThreads(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchThreads(true);
    const interval = setInterval(() => fetchThreads(false), 5000);
    return () => clearInterval(interval);
  }, [isOpen, fetchThreads]);

  // ── Poll active thread messages every 2 seconds ───────────────────────────
  const fetchMessages = useCallback(async (sid: string) => {
    try {
      const data = await getMessagesBySession(sid);
      if (data && data.length !== lastMsgCountRef.current) {
        lastMsgCountRef.current = data.length;
        setMessages(data as Message[]);
      }
    } catch (e) {
      console.error("Message poll error:", e);
    }
  }, []);

  useEffect(() => {
    if (!activeThread || !isOpen) {
      lastMsgCountRef.current = 0;
      return;
    }
    fetchMessages(activeThread.session_id); // immediate
    const interval = setInterval(() => fetchMessages(activeThread.session_id), 2000);
    return () => clearInterval(interval);
  }, [activeThread, isOpen, fetchMessages]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send admin reply ──────────────────────────────────────────────────────
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;
    setIsSending(true);
    const content = replyText.trim();
    setReplyText("");
    try {
      await sendMessage({
        session_id: activeThread.session_id,
        name: "Admin",
        email: "admin",
        content,
        is_admin_reply: true,
      });
      // Fetch immediately so admin sees their own reply right away
      await fetchMessages(activeThread.session_id);
      fetchThreads(false);
    } catch (err) {
      console.error("Reply failed:", err);
    }
    setIsSending(false);
  };

  const unreadCount = threads.filter((t) => t.has_unread).length;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-800 transition-transform hover:scale-105 z-40"
      >
        <MessageSquare size={26} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col font-sans ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        {/* Header */}
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2 pl-1">
            {activeThread ? (
              <button onClick={() => { setActiveThread(null); setMessages([]); lastMsgCountRef.current = 0; }}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-50 transition-colors">
                <ChevronLeft size={20} />
              </button>
            ) : (
              <>
                <MessageSquare size={18} className="text-slate-700" />
                <span className="font-bold text-slate-800 text-base">Client Messages</span>
                {unreadCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">{unreadCount} new</span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!activeThread && (
              <button onClick={() => fetchThreads(true)}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors" title="Refresh">
                <RefreshCw size={15} className={loadingThreads ? "animate-spin" : ""} />
              </button>
            )}
            <button onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
          {!activeThread ? (
            /* Thread List */
            <div className="flex-1 overflow-y-auto bg-white">
              {threads.length === 0 && !loadingThreads ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <MessageSquare size={48} className="mb-4 text-slate-200" strokeWidth={1} />
                  <p className="text-sm font-medium text-slate-500">No conversations yet</p>
                  <p className="text-xs text-slate-400 mt-1">Client messages will appear here automatically.</p>
                </div>
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.session_id}
                    onClick={() => {
                      setActiveThread(thread);
                      setMessages([]);
                      lastMsgCountRef.current = 0;
                      setThreads((prev) => prev.map((t) =>
                        t.session_id === thread.session_id ? { ...t, has_unread: false } : t
                      ));
                    }}
                    className="w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-bold text-sm mt-0.5">
                      {(thread.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm truncate pr-2 ${thread.has_unread ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                          {thread.name || "Anonymous"}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(thread.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-xs truncate flex-1 ${thread.has_unread ? "text-slate-800 font-medium" : "text-slate-500"}`}>
                          {thread.last_message}
                        </p>
                        {thread.has_unread && <Circle size={8} className="fill-blue-500 text-blue-500 shrink-0" />}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            /* Chat View */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0">
                <h3 className="font-bold text-slate-800 text-sm">{activeThread.name || "Anonymous"}</h3>
                {activeThread.email && activeThread.email !== "no-contact" && activeThread.email !== "admin" && (
                  <a href={`https://wa.me/${activeThread.email.replace(/[^0-9]/g, "")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-slate-500 hover:text-green-600 flex items-center gap-1 mt-0.5 w-fit transition-colors">
                    <Phone size={10} /> {activeThread.email}
                  </a>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.is_admin_reply ? "self-end" : "self-start"}`}>
                    <div className="flex items-baseline gap-2 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-500">{msg.is_admin_reply ? "You" : msg.name || "Client"}</span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed ${
                      msg.is_admin_reply
                        ? "bg-slate-800 text-white rounded-tr-none"
                        : "bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <form onSubmit={handleSendReply} className="flex items-end gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply…"
                    rows={1}
                    className="flex-1 bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 px-3 py-2.5 rounded-xl resize-none focus:outline-none focus:border-slate-400 focus:bg-white transition-colors min-h-[44px] max-h-32"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(e); } }}
                  />
                  <button type="submit" disabled={!replyText.trim() || isSending}
                    className="h-[44px] w-[44px] flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                    {isSending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
