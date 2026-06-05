"use client";

import import_react, { useState, useEffect, Suspense, useMemo } from "react";
import { Product } from "@/lib/actions";
import dynamic from "next/dynamic";
import ImageCarousel from "./ImageCarousel";

const ProductModal = dynamic(() => import("./ProductModal"), { ssr: false });
import { useAuth } from "@/components/AuthProvider";
import { Search, Flower2, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

const ITEMS_PER_PAGE = 72;

function getCategoryWeight(category: string) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("lighting")) return 1;
  if (cat.includes("flower") && cat.includes("vase")) return 2;
  if (cat.includes("bathroom") && (cat.includes("plumbing") || cat.includes("plumb"))) return 3;
  if (cat.includes("electrical") && cat.includes("appliance")) return 4;
  return 999;
}

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
  const categoriesQuery = searchParams.get("categories");
  const clientMode = searchParams.get("client") === "true";

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(categoryQuery || "All Collections");
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.visibility !== 'hidden' && p.visibility !== 'archived')
      .filter(p => {
        if (categoriesQuery) {
          const allowed = categoriesQuery.split(',');
          return allowed.includes(p.category);
        }
        return selectedCategory === "All Collections" || p.category === selectedCategory;
      })
      .filter(p => p.name.toLowerCase().includes(urlQuery.toLowerCase()) || (p.tags && p.tags.some(t => t.toLowerCase().includes(urlQuery.toLowerCase()))))
      .sort((a, b) => {
        if (selectedCategory === "All Collections" && !urlQuery) {
          const wA = getCategoryWeight(a.category);
          const wB = getCategoryWeight(b.category);
          if (wA !== wB) return wA - wB;
          if (a.category !== b.category) return (a.category || "").localeCompare(b.category || "");
        }
        
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
            {paginatedProducts.map((product, index) => {
              const images = getProductImages(product);
              const isFlowerArrangement = product.category === "Flowers & Vases" &&
                product.attributes?.component_type === "arrangement";
              const compatibleVaseCount = isFlowerArrangement &&
                Array.isArray(product.attributes?.compatible_vase_ids)
                  ? (product.attributes.compatible_vase_ids as string[]).length
                  : 0;

              const prevProduct = paginatedProducts[index - 1];
              const showHeader = selectedCategory === "All Collections" && !urlQuery && (!prevProduct || prevProduct.category !== product.category);

              return (
                <import_react.Fragment key={product.id}>
                  {showHeader && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full mt-6 mb-2 border-b border-slate-200 pb-2"
                    >
                      <h2 className="text-2xl font-display font-bold text-slate-800">{product.category}</h2>
                    </motion.div>
                  )}
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
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
                </import_react.Fragment>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-20 mb-10 pb-8">
          <div className="inline-flex items-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.05)] px-4 py-2.5 gap-3 border border-slate-50">
            <button 
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-medium transition-all ${
                      currentPage === page 
                        ? 'bg-[#6F7A8B] text-white shadow-sm' 
                        : 'bg-[#F1F3F5] text-slate-700 hover:bg-[#E5E7EB]'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return <span key={page} className="text-slate-400 px-1">...</span>;
              }
              return null;
            })}

            <button 
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
            >
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        user={user}
        allProducts={products}
        isClientShare={clientMode}
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
