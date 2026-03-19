"use client";

import Link from "next/link";
import { User, LogIn, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useSettings } from "./SettingsProvider";

export default function Header() {
  const { user, logout, isLoading } = useAuth();
  const { settings, isMounted } = useSettings();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222] bg-[#0f0f0f]/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {isMounted && settings.companyLogoUrl ? (
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all duration-300 bg-[#111] overflow-hidden border border-[#333]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.companyLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8c7320] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all duration-300">
              <span className="text-[#0f0f0f] font-serif font-bold text-xl leading-none pt-1">
                {isMounted && settings.companyName ? settings.companyName.charAt(0) : 'P'}
              </span>
            </div>
          )}
          <span className="font-serif text-2xl text-[#e0e0e0] font-medium tracking-wide">
            {isMounted && settings.companyName ? settings.companyName : "Premium."}
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-[#888] hover:text-[#d4af37] text-xs font-semibold tracking-widest uppercase transition-colors">Home</Link>
          <Link href="/catalog" className="text-[#888] hover:text-[#d4af37] text-xs font-semibold tracking-widest uppercase transition-colors">Catalog</Link>
        </nav>

        {!isLoading && (
          <div className="flex items-center gap-6">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link href="/admin" className="px-5 py-2.5 bg-gradient-to-r from-[#b39129] to-[#d4af37] text-black text-xs font-medium tracking-[0.2em] uppercase hover:from-[#d4af37] hover:to-[#ebd483] transition-all rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.2)] flex items-center gap-2">
                    <User size={14} /> <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                )}
                <button onClick={logout} className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#888] hover:text-[#d4af37] transition-colors">
                  <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#d4af37] hover:text-[#ebd483] transition-colors">
                <LogIn size={16} /> <span className="hidden sm:inline">Wholesale Login</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
