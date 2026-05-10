"use client";

import { useState, useEffect, Suspense } from "react";
import ProductModal, { Product } from "./ProductModal";
import { useAuth } from "@/components/AuthProvider";
import { Search, LayoutGrid, Lightbulb, Monitor, Watch, Bath, Sofa, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "All Collections":
      return <LayoutGrid size={20} className="mb-2" />;
    case "Lighting":
      return <Lightbulb size={20} className="mb-2" />;
    case "Electronics":
      return <Monitor size={20} className="mb-2" />;
    case "Watches":
      return <Watch size={20} className="mb-2" />;
    case "Bathroom Ware":
    case "Bathroom":
      return <Bath size={20} className="mb-2" />;
    case "Interior Décor":
    case "Interior":
      return <Sofa size={20} className="mb-2" />;
    default:
      return <Package size={20} className="mb-2" />;
  }
};

function ProductGridContent({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const categoryQuery = searchParams.get("category");
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(categoryQuery || "All Collections");
  const { user } = useAuth();
  
  useEffect(() => {
    setSelectedCategory(categoryQuery || "All Collections");
  }, [categoryQuery]);
  
  // Create mock categories for the UI if they don't match the design nicely
  // We'll use the actual categories from products but map 'All' to 'All Collections'
  const rawCategories = Array.from(new Set(products.map(p => p.category))).sort();
  const categories = ["All Collections", ...rawCategories];

  const filteredProducts = products
    .filter(p => selectedCategory === "All Collections" || p.category === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(urlQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="w-full max-w-7xl mx-auto px-6 pt-16">
      

      {urlQuery && (
        <div className="mb-8">
          <p className="text-slate-600">Showing results for: <span className="font-semibold text-slate-900">&quot;{urlQuery}&quot;</span></p>
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="w-full py-20 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Search size={24} />
          </div>
          <h3 className="text-lg font-medium text-slate-600">No products found.</h3>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search query or category.</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12"
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[#f4f4f4] mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-display font-medium text-lg text-slate-900 leading-tight mb-1">{product.name}</h3>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{product.category}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination Mockup from Design */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-20 mb-10">
          <button className="w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors">&lt;</button>
          <button className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white font-medium">1</button>
          <button className="w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">2</button>
          <button className="w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">3</button>
          <span className="px-2 text-slate-400">...</span>
          <button className="w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">&gt;</button>
        </div>
      )}

      <ProductModal 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        user={user}
      />
    </div>
  );
}

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <Suspense fallback={<div className="w-full py-20 text-center text-slate-500">Loading catalog...</div>}>
      <ProductGridContent products={products} />
    </Suspense>
  );
}
