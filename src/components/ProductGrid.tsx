"use client";

import { useState, useEffect } from "react";
import ProductModal, { Product } from "./ProductModal";
import { useAuth } from "./AuthProvider";
import { X, ChevronLeft, Folder } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductGrid({ products }: { products: Product[] }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { user } = useAuth();
  
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredProducts = products
    .filter(p => selectedCategory === "All" || p.category === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  return (
    <>
      <AnimatePresence mode="wait">
        {selectedCategory === "All" ? (
          <motion.div 
            key="folders"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-6xl mx-auto px-4 sm:px-0"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.filter(c => c !== "All").map(cat => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <div
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="group cursor-pointer bg-[#111] border border-[#333] hover:border-[#d4af37]/50 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:-translate-y-1 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#d4af37]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6 text-[#888] group-hover:text-[#d4af37] transition-colors border border-[#222]">
                      <Folder size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-serif text-2xl text-[#fefefe] mb-2">{cat}</h3>
                    <span className="text-[#888] text-sm uppercase tracking-widest font-medium">{count} Items</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="products"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* Breadcrumb Navigation */}
            <div className="w-full max-w-6xl mx-auto mb-8 px-4 sm:px-0">
              <button 
                onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                className="inline-flex items-center gap-2 text-[#888] hover:text-[#d4af37] transition-colors text-xs font-medium uppercase tracking-[0.2em] px-5 py-2.5 border border-[#333] hover:border-[#d4af37]/50 rounded-full bg-[#111] shadow-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]"
              >
                <ChevronLeft size={16} />
                Home <span className="text-[#333] mx-1">/</span> <span className="text-[#fefefe]">{selectedCategory}</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="w-full max-w-2xl mx-auto mb-16 sticky top-28 z-40 bg-[#0f0f0f] py-2 px-4 sm:px-0">
              <div className="relative group">
                <input
                  type="text"
                  className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] pl-8 pr-14 py-5 rounded-full focus:outline-none focus:border-[#d4af37]/70 focus:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all font-light"
                  placeholder={`🔎 Search in ${selectedCategory}...`}
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
                className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 px-4 sm:px-0"
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
                      <div className="relative aspect-square mb-6 overflow-hidden bg-[#0a0a0a] border border-[#222] rounded-md group-hover:border-[#d4af37]/50 transition-colors duration-500 shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#000]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                          <span className="text-[#d4af37] text-xs font-medium uppercase tracking-[0.2em] border border-[#d4af37]/50 px-4 py-2 bg-[#000]/50 backdrop-blur-sm w-full text-center rounded-sm">
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
          </motion.div>
        )}
      </AnimatePresence>

      <ProductModal 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        user={user}
      />
    </>
  );
}
