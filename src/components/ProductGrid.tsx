"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { Product } from "@/lib/actions";
import dynamic from "next/dynamic";
import Image from "next/image";

const ProductModal = dynamic(() => import("./ProductModal"), { ssr: false });
import { useAuth } from "@/components/AuthProvider";
import { Search, LayoutGrid, Lightbulb, Monitor, Watch, Bath, Sofa, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

const ITEMS_PER_PAGE = 52;

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
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  
  const filteredProducts = useMemo(() => {
    return products
      // Treat null/undefined visibility as 'visible' — only explicitly hide 'hidden' or 'archived'
      .filter(p => p.visibility !== 'hidden' && p.visibility !== 'archived')
      .filter(p => selectedCategory === "All Collections" || p.category === selectedCategory)
      .filter(p => p.name.toLowerCase().includes(urlQuery.toLowerCase()) || (p.tags && p.tags.some(t => t.toLowerCase().includes(urlQuery.toLowerCase()))))
      .sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
  }, [products, selectedCategory, urlQuery]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setSelectedCategory(categoryQuery || "All Collections");
    setCurrentPage(1);
  }, [categoryQuery, urlQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    const pages: React.ReactNode[] = [];
    let ellipsisCount = 0;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            aria-label={`Page ${i}`}
            aria-current={currentPage === i ? "page" : undefined}
            className={`w-10 h-10 flex items-center justify-center border text-sm font-medium transition-colors ${
              currentPage === i
                ? "bg-slate-900 text-white border-slate-900"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
            }`}
          >
            {i}
          </button>
        );
      } else {
        const lastItem = pages[pages.length - 1];
        const lastKey = lastItem && (lastItem as React.ReactElement).key;
        if (!String(lastKey).startsWith("ellipsis")) {
          ellipsisCount++;
          pages.push(
            <span key={`ellipsis-${ellipsisCount}`} className="px-2 text-slate-400 select-none">…</span>
          );
        }
      }
    }
    return pages;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 pt-16">
      {urlQuery && (
        <div className="mb-8">
          <p className="text-slate-600">Showing results for: <span className="font-semibold text-slate-900">&quot;{urlQuery}&quot;</span></p>
        </div>
      )}

      {paginatedProducts.length === 0 ? (
        <div className="w-full py-20 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Search size={24} />
          </div>
          <h3 className="text-lg font-medium text-slate-600">No products found.</h3>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          <AnimatePresence>
            {paginatedProducts.map((product) => (
              <motion.div 
                layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}
                key={product.id} onClick={() => setSelectedProduct(product)} className="group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[#f4f4f4] mb-4">
                  <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {product.is_featured && (
                      <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">FEATURED</span>
                    )}
                    {product.availability === 'out_of_stock' && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">OUT OF STOCK</span>
                    )}
                    {product.availability === 'coming_soon' && (
                      <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">COMING SOON</span>
                    )}
                    {product.tags && product.tags.map((tag, idx) => (
                      <span key={idx} className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase">{tag}</span>
                    ))}
                  </div>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-20 mb-10">
          <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="w-10 h-10 flex items-center justify-center border border-slate-200 disabled:opacity-50">&lt;</button>
          {renderPagination()}
          <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="w-10 h-10 flex items-center justify-center border border-slate-200 disabled:opacity-50">&gt;</button>
        </div>
      )}

      <ProductModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} user={user} />
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
