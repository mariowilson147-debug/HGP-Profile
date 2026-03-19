"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";

export type Product = {
  id: string;
  name: string;
  category: string;
  image_url: string;
  wholesale_price?: number;
  retail_price?: number;
};

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

export default function ProductModal({ product, isOpen, onClose, isLoggedIn }: ProductModalProps) {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#000000]/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl bg-[#0f0f0f] border border-[#333] shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden flex flex-col md:flex-row md:border-t-[#d4af37]/30"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[#1a1a1a]/80 backdrop-blur-sm flex items-center justify-center text-[#888] hover:text-[#fefefe] hover:bg-[#333] transition-colors border border-[#333]"
            >
              <X size={20} />
            </button>

            {/* Image Section */}
            <div className="w-full md:w-[55%] aspect-square md:aspect-auto md:min-h-[550px] relative bg-[#0a0a0a] border-r border-[#222]">
              <div className="absolute inset-0 flex items-center justify-center p-8 md:p-12">
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/5 to-transparent mix-blend-overlay pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="w-full md:w-[45%] p-8 md:p-12 flex flex-col justify-center relative bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#d4af37]/5 blur-[100px] rounded-full pointer-events-none"></div>
              
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#1a1a1a] border border-[#222] text-[10px] font-medium text-[#888] uppercase tracking-[0.2em] w-max">
                {product.category}
              </div>
              
              <h2 className="text-3xl md:text-4xl font-serif text-[#fefefe] mb-8 leading-tight">
                {product.name}
              </h2>

              {isLoggedIn && (
                <div className="space-y-6 border-t border-[#222] pt-8 mt-auto">
                  <div className="flex items-center gap-2 text-[#d4af37] bg-[#d4af37]/10 px-4 py-2.5 rounded-sm border border-[#d4af37]/20 w-max mb-6">
                    <CheckCircle2 size={16} />
                    <span className="text-[11px] font-medium uppercase tracking-widest">Wholesale Access Enabled</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 p-6 bg-[#111] border border-[#222] rounded-sm">
                    <div>
                      <div className="text-[10px] text-[#888] uppercase tracking-[0.2em] mb-2">Wholesale Price</div>
                      <div className="text-3xl font-serif text-[#d4af37]">KES {product.wholesale_price?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#888] uppercase tracking-[0.2em] mb-2">Retail Price</div>
                      <div className="text-xl font-serif text-[#aaa] line-through mt-2">KES {product.retail_price?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
