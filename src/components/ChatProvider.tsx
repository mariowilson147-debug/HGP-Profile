"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import ChatDrawer from "./ChatDrawer";

interface ChatContextType {
  isChatOpen: boolean;
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  initialMessage: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");

  const openChat = (message: string = "") => {
    setInitialMessage(message);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setTimeout(() => setInitialMessage(""), 300); // Clear after animation
  };

  return (
    <ChatContext.Provider value={{ isChatOpen, openChat, closeChat, initialMessage }}>
      {children}
      <ChatDrawer />
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
