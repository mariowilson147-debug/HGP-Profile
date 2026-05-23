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
    <div className="bg-apex-surface border border-apex-outline-variant rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
      <div className="px-6 py-4 border-b border-apex-outline-variant flex items-center justify-between">
        <h3 className="text-apex-text font-apex-sans font-medium text-base flex items-center gap-2">
          <Icon className="text-apex-primary" size={18} />
          {title}
        </h3>
        <Link href="/admin/products" className="text-sm font-medium text-apex-primary hover:text-apex-primary/80 flex items-center gap-1 transition-colors">
          Manage <ArrowRight size={14} />
        </Link>
      </div>
      
      {productList.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-apex-on-surface-variant font-apex-sans text-sm py-16">
          {emptyText}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-apex-outline-variant bg-apex-surface-lowest">
                <th className="px-6 py-3 text-xs font-medium text-apex-on-surface-variant uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-xs font-medium text-apex-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-apex-on-surface-variant uppercase tracking-wider text-right">Retail (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apex-outline-variant">
              {productList.map(p => (
                <tr key={p.id} className="hover:bg-apex-surface-lowest transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg border border-apex-outline-variant overflow-hidden bg-apex-surface shrink-0 p-1 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image_url} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-apex-sans font-medium text-apex-text truncate">{p.name}</p>
                        <p className="text-xs text-apex-on-surface-variant font-apex-sans truncate mt-0.5">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      p.is_featured ? 'bg-apex-primary-container text-apex-primary' :
                      p.visibility === 'hidden' || p.visibility === 'archived' ? 'bg-apex-surface-highest text-apex-on-surface-variant' : 'bg-apex-tertiary-container text-apex-tertiary'
                    }`}>
                      {p.is_featured ? 'Featured' : p.visibility === 'visible' ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-sm font-medium text-apex-text">
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
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 font-apex-sans selection:bg-apex-secondary/30">
      <div className="flex justify-between items-end pb-4 border-b border-apex-outline-variant mb-6">
        <div>
          <h2 className="text-2xl font-bold text-apex-text tracking-tight">Catalog Intelligence</h2>
          <p className="font-apex-sans text-sm text-apex-on-surface-variant mt-1">Product insights and visibility</p>
        </div>
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
