"use client";

import Link from "next/link";
import { Search, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSettings } from "./SettingsProvider";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/`);
    }
  };

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#fafafa] border-b border-slate-200 transition-all duration-300">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8 lg:gap-12">
          <Link href="/" className="flex items-center">
            {settings.companyLogoUrl ? (
              <img src={settings.companyLogoUrl} alt={settings.companyName} className="h-16 object-contain mix-blend-multiply scale-150 origin-left" />
            ) : (
              <span className="font-display text-xl font-bold tracking-tight text-slate-900">
                {settings.companyName}
              </span>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold text-slate-900 border-b-2 border-slate-900 pb-0.5">Catalog</Link>
            <Link href="/about" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">About Us</Link>
            <Link href="/faq" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Help Center</Link>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <form onSubmit={handleSearch} className="relative w-48 lg:w-64 xl:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-white border border-slate-200 text-slate-700 pl-4 pr-10 py-1.5 rounded-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all text-sm"
            />
            <button type="submit" className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
              <Search size={16} />
            </button>
          </form>

          {!user ? (
            <a href="https://wa.me/254794577748" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">
              Contact Sales
            </a>
          ) : (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => user.role === 'admin' ? router.push('/admin') : null}>
                <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 group-hover:bg-slate-300 transition-colors">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden lg:block group-hover:text-slate-900 transition-colors">
                  {user.email?.split('@')[0] || "Staff"}
                </span>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors ml-1 p-1 rounded-md hover:bg-slate-100" title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-4 md:hidden">
          {user && (
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 transition-colors" title="Log Out">
              <LogOut size={20} />
            </button>
          )}
          <button 
            className="relative z-50 p-1 text-slate-500 hover:text-slate-900 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-lg md:hidden flex flex-col p-6 gap-4"
          >
            <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }} className="relative w-full mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 pl-4 pr-10 py-2 rounded-sm focus:outline-none focus:border-slate-400 text-sm"
              />
              <button type="submit" className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                <Search size={16} />
              </button>
            </form>
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-900">Catalog</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-600">About Us</Link>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-600">Help Center</Link>
            <div className="h-px w-full bg-slate-100 my-1" />
            
            {user ? (
              <div className="flex items-center gap-3 mt-1">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
                <span className="text-base font-medium text-slate-800">
                  {user.email || "Staff Account"}
                </span>
              </div>
            ) : (
              <a href="https://wa.me/254794577748" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-600">Contact Sales</a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
