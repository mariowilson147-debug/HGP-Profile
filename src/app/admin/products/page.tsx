"use client";

import { useEffect, useState } from "react";
import { getProducts, deleteProduct, getDbCategories, Category } from "@/lib/actions";
import { Product } from "@/lib/actions";
import Link from "next/link";
import { Trash2, Search, Package, Plus, MoreVertical, Filter, Database, HardDrive, Zap } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const loadProducts = async () => {
    setLoading(true);
    const [data, cats] = await Promise.all([getProducts(), getDbCategories()]);
    setProducts(data);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      await deleteProduct(id);
      setDeletingId(null);
      loadProducts();
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Stats calculation
  const totalValuation = products.reduce((acc, curr) => acc + (curr.retail_price || 0), 0);

  return (
    <div className="w-full min-h-screen font-apex-sans max-w-[1400px] mx-auto p-8 pt-6 space-y-8 select-none">
      
      {/* Header Section */}
      <div className="flex justify-between items-start pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-apex-secondary"></div>
            <h2 className="font-apex-sans text-3xl font-black text-apex-text uppercase tracking-tight">REGISTRY: PRODUCTS</h2>
          </div>
          <p className="font-apex-mono text-[10px] text-apex-secondary mt-2 tracking-widest uppercase">
            ARCHIVE_QUERY: [FILTER=CATALOGUE_ALL] | RECORDS_TOTAL: {products.length.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/admin?tab=categories" 
            className="flex items-center gap-2 bg-apex-surface-low border border-apex-outline-variant/30 text-apex-on-surface-variant hover:text-apex-text px-4 py-2.5 font-apex-sans font-bold text-[11px] tracking-wider uppercase transition-colors rounded"
          >
            <Database size={14} /> Manage Categories
          </Link>
          <button className="flex items-center gap-2 bg-apex-surface-low border border-apex-outline-variant/30 text-apex-on-surface-variant hover:text-apex-text px-4 py-2.5 font-apex-sans font-bold text-[11px] tracking-wider uppercase transition-colors rounded">
            <Filter size={14} /> Refine View
          </button>
          <Link 
            href="/admin/product/new" 
            className="bg-apex-text hover:bg-white text-apex-bg font-apex-sans font-bold text-[11px] tracking-widest uppercase px-5 py-2.5 rounded shadow-[0_0_15px_rgba(218,226,253,0.3)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} /> Initialize New Unit
          </Link>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-apex-surface-low border border-apex-outline-variant/20 rounded flex flex-col relative overflow-hidden">
        
        {/* Search Overlay Input (Optional integration) */}
        <div className="absolute top-0 right-0 p-4 w-64 opacity-0 pointer-events-none">
          {/* We keep search state alive behind scenes or we could add a search icon that expands */}
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {/* Table Canvas */}
        <div className="overflow-x-auto min-h-64">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-apex-surface/80 border-b border-apex-outline-variant/20 font-apex-sans font-bold text-[10px] text-apex-on-surface-variant/80 uppercase tracking-widest">
                <th className="py-4 px-6 font-bold w-24">ASSET_VISUAL</th>
                <th className="py-4 px-6 font-bold">IDENTIFIER_STRING</th>
                <th className="py-4 px-6 font-bold">CORE_SERIAL_SKU</th>
                <th className="py-4 px-6 font-bold">CLASSIFICATION</th>
                <th className="py-4 px-6 font-bold">VALUATION_UNIT</th>
                <th className="py-4 px-6 font-bold text-center">PROTOCOL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apex-outline-variant/10 text-apex-text">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-2 border-apex-outline-variant/35 border-t-apex-secondary rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center flex-col items-center justify-center text-apex-on-surface-variant/40 font-apex-mono">
                    <Package size={48} className="mb-4 text-apex-outline/20 mx-auto" strokeWidth={1} />
                    <p className="font-bold text-xs uppercase tracking-widest">NO REGISTRIES DETECTED MATCHING QUERY</p>
                  </td>
                </tr>
              ) : (
                visibleProducts.map((product) => {
                  const cat = categories.find(c => c.name === product.category);
                  const prefix = cat?.sku_prefix || product.category.substring(0, 1);
                  const sku = `NX-${product.id.substring(0, 4)}-${prefix}-CORE`.toUpperCase();
                  const isDeleting = deletingId === product.id;
                  
                  return (
                    <tr key={product.id} className="hover:bg-apex-surface/40 transition-colors group">
                      {/* ASSET_VISUAL */}
                      <td className="py-3 px-6">
                        <Link href={`/admin/product/${product.id}`} className="block w-16 h-10 bg-apex-surface-lowest border border-apex-outline-variant/30 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-apex-secondary/50 transition-colors">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.image_url} alt="" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                        </Link>
                      </td>
                      
                      {/* IDENTIFIER_STRING */}
                      <td className="py-3 px-6">
                        <Link href={`/admin/product/${product.id}`} className="block">
                          <p className="font-apex-sans font-bold text-sm tracking-wide text-apex-text truncate max-w-[200px]">{product.name}</p>
                          <p className="font-apex-mono text-[9px] text-apex-secondary tracking-widest uppercase mt-0.5">{product.category}_TYPE_7</p>
                        </Link>
                      </td>

                      {/* CORE_SERIAL_SKU */}
                      <td className="py-3 px-6 font-apex-mono text-xs text-apex-on-surface-variant tracking-wider">
                        {sku}
                      </td>

                      {/* CLASSIFICATION */}
                      <td className="py-3 px-6">
                        <span className="inline-block px-2 py-0.5 border border-apex-secondary/30 bg-apex-secondary/10 text-apex-secondary font-apex-mono text-[9px] font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(76,215,246,0.1)]">
                          {product.category}
                        </span>
                      </td>

                      {/* VALUATION_UNIT */}
                      <td className="py-3 px-6">
                        <div className="flex items-end gap-1.5">
                          <p className="font-apex-mono text-sm font-bold text-apex-text tracking-wide">{(product.retail_price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                          <p className="font-apex-mono text-[8px] text-apex-on-surface-variant/60 pb-0.5">CRD</p>
                        </div>
                      </td>

                      {/* PROTOCOL */}
                      <td className="py-3 px-6 text-center">
                        {isDeleting ? (
                          <button 
                            onClick={(e) => { e.preventDefault(); handleDelete(product.id); }}
                            className="bg-apex-error/20 text-apex-error border border-apex-error/50 px-2 py-1 font-apex-mono text-[9px] font-bold uppercase rounded tracking-widest shadow-[0_0_10px_rgba(255,180,171,0.2)] animate-pulse"
                          >
                            CONFIRM
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.preventDefault(); handleDelete(product.id); }}
                            className="text-apex-on-surface-variant/50 hover:text-apex-error transition-colors p-2"
                            title="Delete Registry"
                          >
                            <MoreVertical size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Registry Footer Pagination */}
        <div className="px-6 py-4 bg-apex-bg border-t border-apex-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-apex-mono text-[10px] text-apex-on-surface-variant/70 tracking-widest uppercase">
          <div className="flex items-center gap-4">
            <span>SHOWING ENTRY {filteredProducts.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProducts.length)} OF {filteredProducts.length}</span>
            <div className="w-24 h-1 bg-apex-surface rounded-full overflow-hidden flex">
              <div className="h-full bg-apex-secondary" style={{ width: `${filteredProducts.length ? ((Math.min(startIndex + itemsPerPage, filteredProducts.length)) / filteredProducts.length) * 100 : 0}%` }}></div>
            </div>
          </div>
          <div className="flex gap-1.5 text-xs text-apex-text select-none">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-apex-surface-highest bg-apex-surface-low hover:bg-apex-surface cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >&lt;</button>
            <span className="px-3 h-8 flex items-center justify-center rounded border border-apex-secondary bg-apex-surface-low text-apex-secondary font-bold">
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-apex-surface-highest bg-apex-surface-low hover:bg-apex-surface cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >&gt;</button>
          </div>
        </div>

      </div>

      {/* Telemetry Cards at Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        <div className="bg-apex-surface-low border-l-2 border-l-apex-secondary border-t border-r border-b border-apex-outline-variant/20 p-5 flex flex-col justify-between h-32 relative">
          <div className="flex justify-between items-start text-apex-on-surface-variant">
            <span className="font-apex-sans text-xs tracking-widest uppercase font-bold">GLOBAL ASSETS</span>
            <Database size={16} className="text-apex-secondary" />
          </div>
          <div>
            <p className="font-apex-sans text-3xl text-apex-text leading-none font-black tracking-tight">{totalValuation.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            <p className="font-apex-mono text-[9px] text-apex-secondary mt-1 tracking-widest uppercase font-bold">TOTAL_CRD_VALUATION</p>
          </div>
          <div className="absolute bottom-4 left-5 right-5 flex justify-between font-apex-mono text-[9px] text-apex-on-surface-variant/70 uppercase tracking-widest">
            <span>DRIFT: -0.04%</span>
            <span className="text-apex-secondary">HEALTH: OPTIMAL</span>
          </div>
        </div>

        <div className="bg-apex-surface-low border-l-2 border-l-apex-text border-t border-r border-b border-apex-outline-variant/20 p-5 flex flex-col justify-between h-32 relative">
          <div className="flex justify-between items-start text-apex-on-surface-variant">
            <span className="font-apex-sans text-xs tracking-widest uppercase font-bold">ACTIVE NODES</span>
            <HardDrive size={16} className="text-apex-text" />
          </div>
          <div>
            <p className="font-apex-sans text-3xl text-apex-text leading-none font-black tracking-tight">{products.length * 3 + 12}</p>
            <p className="font-apex-mono text-[9px] text-apex-on-surface-variant mt-1 tracking-widest uppercase font-bold">UNITS_ON_STATION</p>
          </div>
          <div className="absolute bottom-4 left-5 right-5 flex justify-between font-apex-mono text-[9px] text-apex-on-surface-variant/70 uppercase tracking-widest">
            <span>LOAD: 64.2%</span>
            <span className="text-apex-text">SYNC: ACTIVE</span>
          </div>
        </div>

        <div className="bg-apex-surface-low border-l-2 border-l-apex-text border-t border-r border-b border-apex-outline-variant/20 p-5 flex flex-col justify-between h-32 relative">
          <div className="flex justify-between items-start text-apex-on-surface-variant">
            <span className="font-apex-sans text-xs tracking-widest uppercase font-bold">NETWORK SPEED</span>
            <Zap size={16} className="text-apex-text" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <p className="font-apex-sans text-3xl text-apex-text leading-none font-black tracking-tight">12.4</p>
              <span className="font-apex-mono text-[10px] text-apex-on-surface-variant tracking-wider font-bold">TB/S</span>
            </div>
            <p className="font-apex-mono text-[9px] text-apex-on-surface-variant mt-1 tracking-widest uppercase font-bold">THROUGHPUT_EFFICIENCY</p>
          </div>
          <div className="absolute bottom-4 left-5 right-5 flex justify-between font-apex-mono text-[9px] text-apex-on-surface-variant/70 uppercase tracking-widest">
            <span>LATENCY: 0.1ms</span>
            <span className="text-apex-text">BANDWIDTH: MAX</span>
          </div>
        </div>

      </div>

    </div>
  );
}
