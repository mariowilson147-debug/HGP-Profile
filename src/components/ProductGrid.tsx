"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { Product } from "@/lib/actions";
import dynamic from "next/dynamic";
import ImageCarousel from "./ImageCarousel";

const ProductModal = dynamic(() => import("./ProductModal"), { ssr: false });
import { useAuth } from "@/components/AuthProvider";
import { Search, Flower2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

const ITEMS_PER_PAGE = 52;


// Build the full images array for a product (primary + variation images)
function getProductImages(product: Product): string[] {
  const extras = Array.isArray(product.attributes?.image_urls)
    ? (product.attributes.image_urls as string[]).filter(Boolean)
    : [];
  return [product.image_url, ...extras].filter(Boolean);
}

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
            {paginatedProducts.map((product) => {
              const images = getProductImages(product);
              const isFlowerArrangement = product.category === "Flowers" &&
                product.attributes?.component_type === "arrangement";
              const compatibleVaseCount = isFlowerArrangement &&
                Array.isArray(product.attributes?.compatible_vase_ids)
                  ? (product.attributes.compatible_vase_ids as string[]).length
                  : 0;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  key={product.id}
                  className="group flex flex-col"
                >
                  {/* ── Image area: carousel handles tap vs swipe internally ── */}
                  <div className="relative w-full overflow-hidden bg-[#f4f4f4] mb-4">
                    <ImageCarousel
                      images={images}
                      alt={product.name}
                      aspectRatio="aspect-square"
                      onClick={() => setSelectedProduct(product)}
                    />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-20 pointer-events-none">
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

                    {/* Flower mix-match badge */}
                    {isFlowerArrangement && compatibleVaseCount > 0 && (
                      <div className="absolute bottom-8 left-2 z-20 pointer-events-none">
                        <span className="flex items-center gap-1 bg-pink-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          <Flower2 size={9} />
                          {compatibleVaseCount} vase option{compatibleVaseCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── Info area: tap to open modal ── */}
                  <div
                    className="flex flex-col cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <h3 className="font-display font-medium text-lg text-slate-900 leading-tight mb-1">{product.name}</h3>
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{product.category}</span>
                    {isFlowerArrangement && (
                      <span className="text-pink-500 text-[9px] font-semibold mt-0.5">Tap to mix &amp; match vases</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
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

      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        user={user}
        allProducts={products}
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
