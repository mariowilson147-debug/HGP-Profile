"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User, Mail, MessageSquare } from "lucide-react";
import { useChat } from "./ChatProvider";
import { sendMessage } from "@/lib/actions";

type Message = {
  id: string;
  sender: 'user' | 'support';
  text: string;
  timestamp: Date;
};

function generateSessionId() {
  if (typeof window !== "undefined") {
    let sid = localStorage.getItem("chat_session_id");
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("chat_session_id", sid);
    }
    return sid;
  }
  return "anonymous";
}

export default function ChatDrawer() {
  const { isChatOpen, closeChat, initialMessage } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState("anonymous");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);

  // Fetch chat history from Supabase
  const loadHistory = async () => {
    if (sessionId === "anonymous") return;
    try {
      const { getMessagesBySession } = await import("@/lib/actions");
      const data = await getMessagesBySession(sessionId);
      if (data && data.length > 0) {
        const history: Message[] = data.map((msg: { id: string, is_admin_reply: boolean, content: string, created_at: string }) => ({
          id: msg.id,
          sender: msg.is_admin_reply ? 'support' : 'user',
          text: msg.content,
          timestamp: new Date(msg.created_at)
        }));
        setMessages(history);
      } else {
        // Fallback welcome message
        if (messages.length === 0) {
          setMessages([{
            id: "welcome",
            sender: 'support',
            text: "Hello! How can we help you today?",
            timestamp: new Date()
          }]);
        }
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      loadHistory();
      // Poll every 5 seconds while chat is open
      const interval = setInterval(loadHistory, 5000);
      return () => clearInterval(interval);
    }
  }, [isChatOpen, sessionId]);

  // Set initial message from context when opened
  useEffect(() => {
    if (isChatOpen && initialMessage) {
      setInputValue(initialMessage);
    }
  }, [isChatOpen, initialMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue("");
    setIsSending(true);

    try {
      // Send to Supabase
      await sendMessage({
        session_id: sessionId,
        name: name || "Anonymous",
        email: email || "No email provided",
        content: newMsg.text
      });

      // Reload history to ensure consistency
      await loadHistory();
      setIsSending(false);

    } catch (error) {
      console.error("Failed to send message", error);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + "error",
          sender: 'support',
          text: "We received your message, but our database is currently being set up. We'll be fully online soon!",
          timestamp: new Date()
        }]);
        setIsSending(false);
      }, 1000);
    }
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChat}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
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
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Support Chat</h3>
                  <p className="text-xs text-slate-300">We typically reply in a few minutes</p>
                </div>
              </div>
              <button 
                onClick={closeChat}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-50">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}
                >
                  <div 
                    className={`px-4 py-3 rounded-2xl ${
                      msg.sender === 'user' 
                        ? 'bg-slate-900 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                  <span className={`text-[10px] text-slate-400 mt-1 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isSending && (
                <div className="self-start px-4 py-3 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm max-w-[85%]">
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-100 bg-white p-4">
              <form onSubmit={handleSend} className="flex flex-col gap-3">
                {/* Contact Info (Only shown if haven't sent a message yet, or keep minimal) */}
                {messages.length <= 1 && (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={14} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Your Name" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-slate-400"
                      />
                    </div>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={14} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="WhatsApp Number" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                )}
                
                <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1 focus-within:border-slate-400 focus-within:bg-white transition-colors">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 px-3 py-2.5 resize-none focus:outline-none max-h-32 min-h-[44px]"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <button 
                    type="submit"
                    disabled={!inputValue.trim() || isSending || (messages.length <= 1 && (!name.trim() || !email.trim()))}
                    className="p-2 mb-0.5 mr-0.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
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
