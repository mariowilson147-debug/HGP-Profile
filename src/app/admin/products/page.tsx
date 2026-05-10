"use client";

import { useEffect, useState } from "react";
import { getProducts, deleteProduct } from "@/lib/actions";
import { Product } from "@/components/ProductModal";
import Link from "next/link";
import { Trash2, Search, Package, Download, ChevronLeft } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
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

  const handleDownloadCSV = () => {
    if (products.length === 0) return;
    const headers = ["ID", "Name", "Category", "Cost Price", "Wholesale Price", "Retail Price"];
    const csvRows = [headers.join(",")];
    for (const p of products) {
      csvRows.push([
        p.id, 
        `"${p.name.replace(/"/g, '""')}"`, 
        `"${p.category}"`, 
        p.buying_price || 0, 
        p.wholesale_price || 0, 
        p.retail_price || 0
      ].join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catalog_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="w-full bg-slate-50 min-h-full pb-12 font-sans pt-12">

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">All Products</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden sm:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 text-slate-700 pl-9 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                <Download size={16} /> Export
              </button>
            </div>
          </div>

          <div className="p-6 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Package size={48} className="mb-4 text-slate-300" strokeWidth={1} />
                <p className="text-slate-500 font-medium">No products found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => {
                  const sku = product.id.substring(0, 8).toUpperCase();
                  return (
                    <div key={product.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col group relative bg-white">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleDelete(product.id); }}
                        className={`absolute top-2 right-2 z-10 px-3 py-1.5 backdrop-blur rounded-lg flex items-center justify-center transition-all ${deletingId === product.id ? 'bg-red-500 text-white opacity-100' : 'bg-white/90 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50'}`}
                        title="Delete Product"
                      >
                        {deletingId === product.id ? (
                          <span className="text-xs font-bold uppercase tracking-wider">Confirm</span>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>

                      <Link href={`/admin/product/${product.id}`} className="block relative aspect-square bg-slate-100 overflow-hidden border-b border-slate-200 p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.image_url} alt="" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                      </Link>

                      <Link href={`/admin/product/${product.id}`} className="flex flex-col p-5 bg-white flex-grow">
                        <h3 className="font-display font-semibold text-slate-800 text-base leading-tight mb-1 truncate">{product.name}</h3>
                        <p className="text-xs text-slate-500 font-mono mb-4">SKU: {product.category.substring(0,3).toUpperCase()}-{sku}</p>
                        
                        <div className="mt-auto space-y-2 text-sm">
                          <div className="flex justify-between items-center text-slate-500">
                            <span>Cost</span>
                            <span className="font-mono text-slate-700">KES {product.buying_price?.toLocaleString() || '0.00'}</span>
                          </div>
                          <div className="flex justify-between items-center font-medium">
                            <span className="text-slate-700">Wholesale</span>
                            <span className="font-mono text-slate-900">KES {product.wholesale_price?.toLocaleString() || '0.00'}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400 text-xs">
                            <span>Retail</span>
                            <span className="font-mono">KES {product.retail_price?.toLocaleString() || '0.00'}</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <span>Showing 1-{filteredProducts.length} of {products.length} products</span>
            <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50">&lt;</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-800 bg-slate-800 text-white font-medium">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 font-medium">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
