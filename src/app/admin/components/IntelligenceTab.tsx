/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { EyeOff, Sparkles, Package, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function IntelligenceTab({ stats }: { stats: any }) {
  const { products } = stats;

  const featuredProducts = products.filter((p: any) => p.is_featured);
  const hiddenProducts = products.filter((p: any) => p.visibility === 'hidden' || p.visibility === 'archived');
  const recentlyAdded = [...products].sort((a: any, b: any) => {
    if (!a.created_at || !b.created_at) return 0;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }).slice(0, 5);

  const ProductList = ({ title, icon: Icon, productList, emptyText }: { title: string, icon: any, productList: any[], emptyText: string }) => (
    <div className="bg-white shadow-sm rounded border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-[#333] font-semibold text-sm flex items-center gap-2">
          <Icon className="text-[#1f4e79]" size={16} />
          {title}
        </h3>
        <Link href="/admin/products" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          Manage <ArrowRight size={12} />
        </Link>
      </div>
      
      {productList.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-12 border-t border-slate-100/50 border-dashed m-4 rounded">
          {emptyText}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] uppercase font-semibold text-slate-400 tracking-wider text-right">Retail (KES)</th>
              </tr>
            </thead>
            <tbody>
              {productList.map(p => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden bg-white shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      p.is_featured ? 'border border-amber-200 bg-amber-50 text-amber-700' :
                      p.visibility === 'hidden' || p.visibility === 'archived' ? 'border border-slate-200 bg-slate-100 text-slate-500' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}>
                      {p.is_featured ? 'Featured' : p.visibility === 'visible' ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-sm font-semibold text-slate-700">
                      {p.retail_price?.toLocaleString() || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Catalog Intelligence</h2>
        <p className="text-sm text-slate-500">Monitor visibility and engagement status.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductList title="Recently Added Products" icon={Package} productList={recentlyAdded} emptyText="No products added yet." />
        <ProductList title="Featured Products" icon={Sparkles} productList={featuredProducts} emptyText="No products marked as featured." />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductList title="Hidden & Archived" icon={EyeOff} productList={hiddenProducts} emptyText="No hidden products." />
      </div>
    </div>
  );
}
