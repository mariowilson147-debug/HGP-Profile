"use client";

import { useState, useEffect } from "react";
import ProductModal, { Product } from "./ProductModal";
import { useAuth } from "./AuthProvider";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductGrid({ products }: { products: Product[] }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  return (
    <>
      {/* Search Bar */}
      <div className="w-full max-w-2xl mx-auto mb-16 sticky top-28 z-40 bg-[#0f0f0f] py-2">
        <div className="relative group">
          <input
            type="text"
            className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] pl-8 pr-14 py-5 rounded-full focus:outline-none focus:border-[#d4af37]/70 focus:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all font-light"
            placeholder="🔎 Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-6 flex items-center text-[#888] hover:text-[#d4af37] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="w-full py-20 flex flex-col items-center justify-center text-[#888]">
          <h3 className="text-xl font-serif text-[#888] mb-2">No products found.</h3>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16"
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-square mb-6 overflow-hidden bg-[#0a0a0a] border border-[#222] rounded-sm group-hover:border-[#d4af37]/50 transition-colors duration-500 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                    <span className="text-[#d4af37] text-xs font-medium uppercase tracking-[0.2em] border border-[#d4af37]/50 px-4 py-2 bg-[#000]/50 backdrop-blur-sm w-full text-center">
                      View Details
                    </span>
                  </div>
                </div>
                <div className="flex flex-col text-center px-4">
                  <span className="text-[#888] text-[10px] uppercase tracking-[0.2em] mb-3">{product.category}</span>
                  <h3 className="font-serif text-xl text-[#e0e0e0] group-hover:text-[#d4af37] transition-colors">{product.name}</h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <ProductModal 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        user={user}
      />
    </>
  );
}
