"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User, Phone, MessageSquare } from "lucide-react";
import { useChat } from "./ChatProvider";
import { sendMessage, getMessagesBySession } from "@/lib/actions";

type Message = {
  id: string;
  session_id: string;
  name: string;
  content: string;
  is_admin_reply: boolean;
  created_at: string;
};

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "anonymous";
  let sid = localStorage.getItem("chat_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("chat_session_id", sid);
  }
  return sid;
}

export default function ChatDrawer() {
  const { isChatOpen, closeChat, initialMessage } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState<string>(() => getOrCreateSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  // ── Load stored name/contact ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      setName(localStorage.getItem("chat_name") || "");
      setContact(localStorage.getItem("chat_contact") || "");
    }
  }, []);

  // ── Poll messages every 2 seconds while chat is open ─────────────────────
  const fetchMessages = useCallback(async () => {
    if (sessionId === "anonymous") return;
    try {
      const data = await getMessagesBySession(sessionId);
      if (data && data.length > 0) {
        // Only update state if something actually changed
        if (data.length !== lastCountRef.current) {
          lastCountRef.current = data.length;
          setMessages(data as Message[]);
        }
      } else if (lastCountRef.current === 0) {
        // Show welcome only on first open with no history
        setMessages([{
          id: "welcome",
          session_id: sessionId,
          name: "Support",
          content: "Hello! How can we help you today?",
          is_admin_reply: true,
          created_at: new Date().toISOString(),
        }]);
      }
    } catch (e) {
      console.error("Poll error:", e);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isChatOpen) return;
    fetchMessages(); // immediate on open
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [isChatOpen, fetchMessages]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Pre-fill initial message ─────────────────────────────────────────────
  useEffect(() => {
    if (isChatOpen && initialMessage) setInputValue(initialMessage);
  }, [isChatOpen, initialMessage]);

  const hasIntroduced = messages.some((m) => !m.is_admin_reply && m.id !== "welcome");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (!hasIntroduced && (!name.trim() || !contact.trim())) return;

    if (name) localStorage.setItem("chat_name", name);
    if (contact) localStorage.setItem("chat_contact", contact);

    const text = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    try {
      await sendMessage({
        session_id: sessionId,
        name: name || "Visitor",
        email: contact || "no-contact",
        content: text,
        is_admin_reply: false,
      });
      // Immediately fetch so the sent message appears without waiting for next poll
      await fetchMessages();
    } catch (err) {
      console.error("Failed to send:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          session_id: sessionId,
          name: "System",
          content: "Message failed to send. Please try again.",
          is_admin_reply: true,
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setIsSending(false);
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChat}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white shadow-2xl z-[110] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Support Chat</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-xs text-slate-300">Online — replies in minutes</p>
                  </div>
                </div>
              </div>
              <button onClick={closeChat} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 bg-slate-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.is_admin_reply ? "self-start" : "self-end"}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.is_admin_reply
                      ? "bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm"
                      : "bg-slate-900 text-white rounded-tr-none"
                  }`}>
                    {msg.content}
                  </div>
                  <span className={`text-[10px] text-slate-400 mt-1 px-1 ${msg.is_admin_reply ? "text-left" : "text-right"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
              {isSending && (
                <div className="self-start px-4 py-3 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm">
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 bg-white p-4">
              <form onSubmit={handleSend} className="flex flex-col gap-3">
                {!hasIntroduced && (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Your Name" value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-slate-400" />
                    </div>
                    <div className="relative flex-1">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="WhatsApp Number" value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-slate-400" />
                    </div>
                  </div>
                )}
                <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1 focus-within:border-slate-400 focus-within:bg-white transition-colors">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 px-3 py-2.5 resize-none focus:outline-none max-h-32 min-h-[44px]"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                  />
                  <button type="submit"
                    disabled={!inputValue.trim() || isSending || (!hasIntroduced && (!name.trim() || !contact.trim()))}
                    className="p-2 mb-0.5 mr-0.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
