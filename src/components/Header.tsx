"use client";

import Link from "next/link";
import { User, Menu, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getProducts } from "@/lib/actions";
import { useSettings } from "@/components/SettingsProvider";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isStrict, setIsStrict] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    async function fetchCats() {
      try {
        const params = newSearchParams();
        const strictMode = params.get("strict") === "true";
        const catParam = params.get("category");
        setIsStrict(strictMode);

        const products = await getProducts();
        const unique = Array.from(new Set(products.map(p => p.category)));
        
        let cats = ["All Collections", ...unique];
        if (strictMode && catParam) {
          const allowed = catParam.split(',');
          cats = cats.filter(c => allowed.includes(c));
        }
        setCategories(cats);
      } catch(e) {}
    }
    
    // Quick fix: define newSearchParams locally if window isn't ready
    function newSearchParams() {
      return typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    }
    fetchCats();
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleLoginClick = () => {
    if (user) {
      if (user.role === 'admin') router.push('/admin');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none transition-all duration-300">
      <header className="w-full max-w-7xl bg-[#f1f0ec]/90 backdrop-blur-xl border border-[#e5e4e0] shadow-lg shadow-black/5 rounded-full pointer-events-auto h-16 px-6 md:px-8 flex items-center justify-between transition-all duration-300 relative">
        
        {/* Left: Logo */}
        <div className="flex-1 flex items-center">
          <Link href="/" className="text-2xl font-black tracking-tight text-slate-900 lowercase font-outfit">
            {settings?.companyName ? settings.companyName.split(' ')[0] : 'luxf'}
          </Link>
        </div>

        {/* Center: Categories */}
        <nav className="hidden md:flex flex-none items-center justify-center gap-8">
          {categories.filter(c => c !== "All Collections").slice(0, 3).map((cat) => (
            <Link 
              key={cat} 
              href={`/?category=${encodeURIComponent(cat)}${isStrict ? '&strict=true' : ''}`}
              className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              {cat}
            </Link>
          ))}
          <Link href="/contact" className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Contact
          </Link>
        </nav>

        {/* Right: Icons */}
        <div className="flex-1 flex items-center justify-end gap-3 md:gap-4">
          <button onClick={handleLoginClick} className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-200/50 transition-colors" title={user ? "Account" : "Log In"}>
            <User size={16} strokeWidth={1.5} />
          </button>

          {user && (
            <button onClick={handleLogout} className="hidden md:flex w-10 h-10 rounded-full border border-slate-300 items-center justify-center text-slate-600 hover:bg-slate-200/50 hover:text-red-500 transition-colors" title="Log Out">
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          )}

          {/* Mobile menu button */}
          <button 
            className="md:hidden w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-200/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-[4.5rem] left-0 right-0 w-full bg-[#f1f0ec]/95 backdrop-blur-xl border border-[#e5e4e0] shadow-2xl rounded-3xl md:hidden flex flex-col p-6 gap-4 z-40"
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</h3>
              <div className="flex flex-col gap-4">
                {categories.map((cat) => (
                  <Link 
                    key={cat} 
                    href={cat === "All Collections" ? "/" : `/?category=${encodeURIComponent(cat)}${isStrict ? '&strict=true' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-slate-600 hover:text-slate-900"
                  >
                    {cat}
                  </Link>
                ))}
                <Link 
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-slate-600 hover:text-slate-900"
                >
                  Contact
                </Link>
              </div>

              <div className="h-px w-full bg-slate-200/60 my-2" />
              
              {user ? (
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setMobileMenuOpen(false); user.role === 'admin' && router.push('/admin'); }}>
                    <div className="w-10 h-10 bg-white border border-slate-300 rounded-full flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                      {user.email?.[0].toUpperCase() || "U"}
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {user.email || "Account"}
                    </span>
                  </div>
                  <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 p-2 border border-transparent hover:border-red-100 rounded-full">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
}
