"use client";

import { useEffect, useState, useRef } from "react";
import { getChatThreads, getMessagesBySession, sendMessage } from "@/lib/actions";
import { Search, Send, User, MessageSquare, Clock, RefreshCw, Phone, X, ChevronLeft } from "lucide-react";

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
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    setLoadingThreads(true);
    try {
      const data = await getChatThreads();
      setThreads(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingThreads(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadThreads();
      const interval = setInterval(loadThreads, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadMessages = async (session_id: string) => {
    setLoadingMessages(true);
    try {
      const data = await getMessagesBySession(session_id);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingMessages(false);
    scrollToBottom();
  };

  useEffect(() => {
    if (activeThread && isOpen) {
      loadMessages(activeThread.session_id);
      const interval = setInterval(() => loadMessages(activeThread.session_id), 5000);
      return () => clearInterval(interval);
    }
  }, [activeThread, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

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
        email: "admin@company.com",
        content: content,
        is_admin_reply: true
      });
      await loadMessages(activeThread.session_id);
      loadThreads();
    } catch (error) {
      console.error("Failed to send reply", error);
    }
    setIsSending(false);
  };

  // Calculate unread count globally
  const unreadCount = threads.filter(t => t.has_unread).length;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-800 transition-transform hover:scale-105 z-40 group"
      >
        <MessageSquare size={28} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col font-sans ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Main Header */}
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {activeThread ? (
              <button onClick={() => setActiveThread(null)} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-50 transition-colors">
                <ChevronLeft size={20} />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-slate-800 font-display font-bold text-lg pl-2">
                <MessageSquare size={20} />
                Client Messages
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!activeThread && (
              <button onClick={loadThreads} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors" title="Refresh">
                <RefreshCw size={16} className={loadingThreads ? "animate-spin" : ""} />
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-slate-50">
          {!activeThread ? (
            /* Thread List View */
            <div className="h-full overflow-y-auto bg-white">
              {threads.length === 0 && !loadingThreads ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                  <MessageSquare size={48} className="mb-4 opacity-20" strokeWidth={1} />
                  <p className="text-sm font-medium text-slate-500">No active conversations</p>
                  <p className="text-xs text-slate-400 mt-1">When clients message you from the catalog, they will appear here.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {threads.map(thread => (
                    <button
                      key={thread.session_id}
                      onClick={() => setActiveThread(thread)}
                      className={`w-full text-left p-4 border-b border-slate-100 transition-colors flex flex-col gap-1 hover:bg-slate-50`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`font-semibold text-sm truncate pr-2 ${thread.has_unread ? 'text-slate-900' : 'text-slate-700'}`}>
                          {thread.name || 'Anonymous User'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          {new Date(thread.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between w-full gap-2">
                        <p className={`text-xs truncate flex-1 ${thread.has_unread ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                          {thread.last_message}
                        </p>
                        {thread.has_unread && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Chat View */
            <div className="h-full flex flex-col">
              {/* Chat Sub-Header */}
              <div className="px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-10 flex flex-col">
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{activeThread.name || 'Anonymous User'}</h3>
                {activeThread.email && (
                  <a 
                    href={`https://wa.me/${activeThread.email.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 mt-0.5 transition-colors w-fit"
                  >
                    <Phone size={10} />
                    {activeThread.email}
                  </a>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw size={24} className="animate-spin text-slate-300" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.is_admin_reply;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col max-w-[85%] ${isAdmin ? 'self-end' : 'self-start'}`}
                      >
                        <div className="flex items-baseline gap-2 mb-1 px-1">
                          <span className="text-[10px] font-bold text-slate-500">
                            {isAdmin ? 'You' : (msg.name || 'Client')}
                          </span>
                          <span className="text-[9px] font-medium text-slate-400">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div 
                          className={`px-3.5 py-2.5 rounded-2xl ${
                            isAdmin 
                              ? 'bg-slate-800 text-white rounded-tr-none' 
                              : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                          }`}
                        >
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <form onSubmit={handleSendReply} className="relative flex items-end gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply..."
                    className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 px-3 py-2.5 rounded-xl resize-none focus:outline-none focus:border-slate-400 focus:bg-white transition-colors min-h-[44px] max-h-32"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                  />
                  <button 
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="h-[44px] w-[44px] flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm"
                  >
                    {isSending ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />
                    )}
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
