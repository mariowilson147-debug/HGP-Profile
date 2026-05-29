"use client";

import { useState, useEffect } from "react";
import { Share2, Check, Copy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthProvider";
import { getProducts } from "@/lib/actions";

export default function ShareWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && categories.length === 0) {
      const fetchCats = async () => {
        const products = await getProducts();
        const unique = Array.from(new Set(products.map(p => p.category)));
        setCategories(unique);
      };
      fetchCats();
    }
  }, [isOpen, categories.length]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleCopy = async () => {
    const baseUrl = window.location.origin;
    const url = new URL(baseUrl);
    url.searchParams.set("client", "true");
    if (selectedCategories.length > 0) {
      url.searchParams.set("categories", selectedCategories.join(","));
    }
    
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch(e) {
      alert("Failed to copy link.");
    }
  };

  // Only render for logged-in users
  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Share Client Link"
        className="fixed bottom-[110px] right-8 w-12 h-12 bg-white text-slate-800 rounded-full shadow-xl flex items-center justify-center hover:bg-slate-50 border border-slate-200 active:scale-95 transition-all duration-200 hover:scale-105 z-40"
      >
        <Share2 size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden p-6"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-display font-medium text-slate-900 mb-2">Share Client Catalog</h2>
              <p className="text-sm text-slate-500 mb-6">
                Create a price-free catalog link tailored to your client. 
                Choose which categories to include.
              </p>

              <div className="mb-6 max-h-[40vh] overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Categories to Include</h3>
                {categories.length === 0 ? (
                  <div className="text-sm text-slate-400 py-2 animate-pulse">Loading categories...</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 cursor-pointer bg-slate-50/50 transition-colors">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          selectedCategories.includes(cat) ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300'
                        }`}>
                          {selectedCategories.includes(cat) && <Check size={14} className="text-white" />}
                        </div>
                        <span className="text-sm text-slate-700 font-medium">{cat}</span>
                        <input 
                          type="checkbox"
                          className="hidden"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy Client Link
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
