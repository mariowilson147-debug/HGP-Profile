"use client";

import Link from "next/link";
import { useSettings } from "./SettingsProvider";

export default function Footer() {
  const { settings } = useSettings();
  
  return (
    <footer className="w-full bg-[#fafafa] border-t border-slate-200 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          {settings.companyLogoUrl ? (
            <img src={settings.companyLogoUrl} alt={settings.companyName} className="h-16 object-contain mix-blend-multiply scale-150 grayscale opacity-70 hover:opacity-100 transition-opacity origin-left" />
          ) : (
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">
              {settings.companyName}
            </span>
          )}
        </div>

        {/* Center: Links */}
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-sm font-medium text-slate-500">
          <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
          <Link href="/about" className="hover:text-slate-900 transition-colors">Company About</Link>
          <a href="https://wa.me/254794577748" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Contacts</a>
          <span className="text-slate-300">|</span>
          <Link href="/login" className="hover:text-slate-900 transition-colors">Seller Login</Link>
          <Link href="/login" className="hover:text-slate-900 transition-colors">Admin Login</Link>
        </div>

        {/* Right: Copyright */}
        <div className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} {settings.companyName} All rights reserved.
        </div>
        
      </div>
    </footer>
  );
}

