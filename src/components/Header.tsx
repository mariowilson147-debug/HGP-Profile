"use client";

import Link from "next/link";
import { User, LogIn, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";

export default function Header() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222] bg-[#0f0f0f]/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          <span className="font-sans text-3xl font-bold tracking-[0.1em] text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.6)] transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(212,175,55,0.9)]">
            HGP
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
                <LogIn size={16} /> <span className="hidden sm:inline">Login</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
