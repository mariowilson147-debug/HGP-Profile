"use client";

import { useState, useEffect, useRef } from "react";
import { getProducts, type Product as BaseProduct } from "@/lib/actions";
import { Search, Loader2, Image as ImageIcon, Lightbulb, Bath, Sofa, Plug, Shirt, Package, Home, Wrench, Box, ShoppingCart, LayoutGrid, ArrowLeft, ArrowRight, Store, Globe, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type Product = BaseProduct & { stock_level?: number };

const IconMap: Record<string, React.ElementType> = {
  Lightbulb, Bath, Sofa, Plug, Shirt, Package, Home, Wrench, Box, ShoppingCart, LayoutGrid
};

export default function CatalogueView({ returnPath, branchId }: { returnPath: string, branchId?: string | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"universal" | "branch">(branchId ? "branch" : "universal");
  const [selectedViewBranch, setSelectedViewBranch] = useState<string>(branchId || "");
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { settings } = useSettings();
  const supabase = createSupabaseBrowserClient();

  // Fetch branches
  useEffect(() => {
    supabase.from('branches').select('id, name').then(({data}) => {
      if (data) {
        setBranches(data);
        if (!selectedViewBranch && data.length > 0) {
          setSelectedViewBranch(data[0].id);
        }
      }
    });
  }, [supabase, selectedViewBranch]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      if (viewMode === "universal" || !selectedViewBranch) {
        const data = await getProducts();
        if (mounted) {
          // Sort universal products alphabetically by name
          data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          setProducts(data);
          setLoading(false);
        }
      } else {
        const data = await getProducts();
        const { data: invData } = await supabase
          .from('inventory')
          .select('product_id, stock_level, branch_wholesale_price, branch_retail_price')
          .eq('branch_id', selectedViewBranch);
          
        if (mounted) {
          if (data) {
            const invMap = new Map(invData?.map(i => [i.product_id, i]) || []);
            const branchProducts = data
              .filter(prod => invMap.has(prod.id))
              .map(prod => {
                const inv = invMap.get(prod.id)!;
                return {
                  ...prod,
                  stock_level: inv.stock_level,
                  wholesale_price: inv.branch_wholesale_price ?? prod.wholesale_price,
                  retail_price: inv.branch_retail_price ?? prod.retail_price
                };
              });
            // Sort branch products alphabetically by name
            branchProducts.sort((a, b) => ((a as Product).name || "").localeCompare((b as Product).name || ""));
            setProducts(branchProducts as Product[]);
          } else {
            setProducts([]);
          }
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false };
  }, [viewMode, selectedViewBranch, supabase]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isSearching) {
      if (searchInputRef.current) searchInputRef.current.focus();
      timeoutId = setTimeout(() => {
        setIsSearching(false);
      }, 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSearching, search]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 72;
  
  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div>
            <Link href={returnPath} className="hover:opacity-80 transition-opacity">
              <h1 className="text-3xl font-display font-bold text-slate-900">Catalogue</h1>
            </Link>
            <p className="text-slate-500 mt-2">Browse the product registry and pricing.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
            <div className="flex bg-slate-100/50 rounded-xl p-1 w-fit">
              <button
                onClick={() => setViewMode("universal")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'universal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Globe size={16} /> Universal
              </button>
              <button
                onClick={() => setViewMode("branch")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'branch' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Store size={16} /> Branch Stock
              </button>
            </div>
            
            {viewMode === "branch" && (
              <select 
                value={selectedViewBranch} 
                onChange={(e) => setSelectedViewBranch(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none shadow-sm min-w-[150px]"
              >
                <option value="" disabled>Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}

          </div>
        </div>
        
        <div className="flex items-center gap-2 justify-end">
          {/* Category Icons */}
          <div className="hidden md:flex gap-1 items-center mr-2">
            {Array.from(new Set(products.map(p => p.category))).slice(0, 5).map(catName => {
              const catObj = settings.categories?.find(c => c.name === catName);
              const Icon = catObj && catObj.icon_name && IconMap[catObj.icon_name] ? IconMap[catObj.icon_name] : Package;
              return (
                <button 
                  key={catName}
                  onClick={() => setSearch(search === catName ? "" : catName)}
                  title={catName}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${search === catName ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <Icon size={18} strokeWidth={2} />
                </button>
              );
            })}
          </div>

          {/* Expanding Search Icon */}
          <div className="relative flex items-center justify-end">
            <div className={`flex items-center bg-white border border-slate-200 rounded-full p-1 transition-all duration-300 shadow-sm ${isSearching || search ? 'w-full md:w-64' : 'w-10'}`}>
              <button 
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSearching || search ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}
                onClick={() => {
                  if (isSearching && !search) setIsSearching(false);
                  else setIsSearching(true);
                }}
              >
                <Search size={14} strokeWidth={2.5} />
              </button>
              <input 
                ref={searchInputRef}
                id="search-input"
                type="text" 
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsSearching(true)}
                className={`bg-transparent border-none focus:outline-none text-sm text-slate-700 placeholder:text-slate-400 h-full transition-all duration-300 ${isSearching || search ? 'w-full px-3 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-slate-400 mb-4" size={32} />
          <p className="text-slate-500 text-sm animate-pulse">Loading catalogue...</p>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentProducts.map(product => (
              <div 
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col"
              >
                {/* Image Section */}
                <div className="relative aspect-square bg-slate-50 border-b border-slate-100">
                  {product.image_url ? (
                    <Image 
                      src={product.image_url} 
                      alt={product.name}
                      fill
                      className="object-contain mix-blend-multiply p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm border border-slate-100/50">
                      {product.category}
                    </span>
                    {product.availability === 'out_of_stock' && viewMode === 'universal' && (
                      <span className="px-2.5 py-1 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Stock Quantity Badge (Top Right) */}
                  {viewMode === 'branch' && product.stock_level !== undefined && (
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                      <div className={`px-3 py-1.5 backdrop-blur-md rounded-xl font-display font-bold text-sm shadow-sm flex flex-col items-center border ${product.stock_level > 5 ? 'bg-emerald-500/90 text-white border-emerald-400' : product.stock_level > 0 ? 'bg-amber-500/90 text-white border-amber-400' : 'bg-red-500/90 text-white border-red-400'}`}>
                        <span>{product.stock_level}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-1 leading-tight">
                    {product.name}
                  </h3>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                        {tag}
                      </span>
                    ))}
                    {product.tags?.length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                        +{product.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-medium text-slate-500">Retail</span>
                      <span className="text-sm font-bold text-slate-900">
                        KES {product.retail_price?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-medium text-slate-500">Wholesale</span>
                      <span className="text-lg font-display font-bold text-slate-900 tracking-tight">
                        KES {product.wholesale_price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Search className="mx-auto text-slate-300 mb-3" size={32} />
                <h3 className="text-lg font-medium text-slate-900">No products found</h3>
                <p className="text-slate-500 mt-1">Try adjusting your search terms.</p>
              </div>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center pb-8">
              <div className="inline-flex items-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.05)] px-4 py-2.5 gap-3 border border-slate-50">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                >
                  <ArrowLeft size={20} strokeWidth={2.5} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Only show a few pages around current to avoid huge pagination bars
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                >
                  <ArrowRight size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
