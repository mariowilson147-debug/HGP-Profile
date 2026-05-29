"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initial = user.nickname ? user.nickname.charAt(0).toUpperCase() : "M";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center outline-none ring-2 ring-transparent focus:ring-blue-300 hover:ring-blue-200 transition-all shadow-sm relative"
      >
        {/* Colorful border effect to match inspiration image */}
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 opacity-50 blur-[2px] z-[-1]"></div>
        <span className="z-10">{initial}</span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 flex flex-col gap-1"
          >
            <button 
              onClick={() => { setIsOpen(false); router.push('/manager'); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors w-full text-left font-medium"
            >
              <LayoutDashboard size={18} className="text-slate-500" />
              Dashboard
            </button>
            
            <button 
              onClick={() => { setIsOpen(false); router.push('/manager/settings'); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors w-full text-left font-medium"
            >
              <Settings size={18} className="text-slate-500" />
              Settings
            </button>

            <div className="h-px bg-slate-100 my-1 mx-2" />

            <button 
              onClick={() => { setIsOpen(false); logout(); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors w-full text-left font-medium"
            >
              <LogOut size={18} className="text-red-500" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
