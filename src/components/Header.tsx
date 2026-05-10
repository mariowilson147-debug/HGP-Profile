"use client";

import Link from "next/link";
import { Search, Menu, LogOut, Lightbulb, Bath, Sofa, Plug, Shirt, Package, LayoutGrid } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getProducts } from "@/lib/actions";

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('all')) return <LayoutGrid size={20} />;
  if (cat.includes('light') || cat.includes('lamp')) return <Lightbulb size={20} />;
  if (cat.includes('bath') || cat.includes('plumb') || cat.includes('water')) return <Bath size={20} />;
  if (cat.includes('sofa') || cat.includes('decor') || cat.includes('furniture')) return <Sofa size={20} />;
  if (cat.includes('electric') || cat.includes('cable') || cat.includes('plug') || cat.includes('electronic')) return <Plug size={20} />;
  if (cat.includes('wear') || cat.includes('shirt') || cat.includes('bottom') || cat.includes('clothing')) return <Shirt size={20} />;
  return <Package size={20} />;
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isStrict, setIsStrict] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchCats() {
      try {
        const params = new URLSearchParams(window.location.search);
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
    fetchCats();
  }, []);

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
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none transition-all duration-300">
      <header className="w-full max-w-7xl bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-lg shadow-slate-200/50 rounded-full pointer-events-auto h-16 flex items-center justify-between px-6 gap-6">
        
        {/* Left: Search Bar */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-slate-100/50 border border-slate-200 text-slate-800 pl-4 pr-10 py-2 rounded-full focus:outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all text-sm"
            />
            <button type="submit" className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
              <Search size={16} />
            </button>
          </form>
        </div>

        {/* Right: Categories (Icons) & Auth */}
        <div className="hidden md:flex items-center gap-4 justify-end flex-1">
          <nav className="flex items-center gap-2">
            {categories.map((cat) => (
              <Link 
                key={cat} 
                href={cat === "All Collections" ? "/" : `/?category=${encodeURIComponent(cat)}${isStrict ? '&strict=true' : ''}`}
                className="relative group p-2.5 text-slate-500 hover:text-slate-900 transition-colors rounded-xl hover:bg-slate-100"
              >
                {getCategoryIcon(cat)}
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-slate-800 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-sm">
                  {cat}
                </div>
              </Link>
            ))}
          </nav>

          {user && (
            <>
              <div className="w-px h-6 bg-slate-200 mx-2" />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => user.role === 'admin' ? router.push('/admin') : null}>
                  <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 group-hover:bg-slate-200 transition-colors">
                    {user.email?.[0].toUpperCase() || "U"}
                  </div>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50" title="Log Out">
                  <LogOut size={16} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-4 md:hidden">
          <button 
            className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[4.5rem] left-0 right-0 w-full bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl md:hidden flex flex-col p-6 gap-4"
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</h3>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <Link 
                  key={cat} 
                  href={cat === "All Collections" ? "/" : `/?category=${encodeURIComponent(cat)}${isStrict ? '&strict=true' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    {getCategoryIcon(cat)}
                  </div>
                  {cat}
                </Link>
              ))}
            </div>

            <div className="h-px w-full bg-slate-100 my-2" />
            
            {user ? (
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setMobileMenuOpen(false); user.role === 'admin' && router.push('/admin'); }}>
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                    {user.email?.[0].toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    {user.email || "Account"}
                  </span>
                </div>
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 p-2">
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
