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
    <div className="apex-glass-panel border border-apex-outline-variant/20 rounded overflow-hidden flex flex-col h-full bg-apex-surface-low/30">
      <div className="px-6 py-4 border-b border-apex-outline-variant/20 flex items-center justify-between bg-apex-surface-low">
        <h3 className="text-apex-text font-apex-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <Icon className="text-apex-secondary" size={16} />
          {title}
        </h3>
        <Link href="/admin/products" className="text-xs text-apex-secondary font-apex-mono uppercase tracking-wider hover:text-apex-text flex items-center gap-1">
          Manage <ArrowRight size={12} />
        </Link>
      </div>
      
      {productList.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-apex-on-surface-variant/40 font-apex-mono text-xs uppercase py-16">
          {emptyText}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-apex-outline-variant/20 bg-apex-surface-low/30">
                <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-on-surface-variant/60 tracking-widest font-apex-mono">Product Name</th>
                <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-on-surface-variant/60 tracking-widest font-apex-mono">Status</th>
                <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-on-surface-variant/60 tracking-widest font-apex-mono text-right">Retail (KES)</th>
              </tr>
            </thead>
            <tbody>
              {productList.map(p => (
                <tr key={p.id} className="border-b border-apex-outline-variant/10 last:border-0 hover:bg-apex-surface-low/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border border-apex-outline-variant/20 overflow-hidden bg-apex-surface-lowest shrink-0 p-0.5 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image_url} alt="" className="w-full h-full object-contain grayscale opacity-80" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-apex-sans font-bold text-apex-text truncate">{p.name}</p>
                        <p className="text-[10px] text-apex-secondary font-apex-mono truncate">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border font-apex-mono ${
                      p.is_featured ? 'border-apex-primary/30 bg-apex-primary/10 text-apex-primary shadow-[0_0_8px_rgba(192,193,255,0.15)]' :
                      p.visibility === 'hidden' || p.visibility === 'archived' ? 'border-apex-outline-variant/30 bg-apex-surface-highest/50 text-apex-on-surface-variant' : 'border-apex-secondary/30 bg-apex-secondary/10 text-apex-secondary shadow-[0_0_8px_rgba(76,215,246,0.15)]'
                    }`}>
                      {p.is_featured ? 'Featured' : p.visibility === 'visible' ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-xs font-apex-mono font-bold text-apex-text">
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
      <div className="flex justify-between items-end pb-4 border-b border-apex-outline-variant/10 mb-2">
        <div>
          <span className="text-apex-secondary font-apex-mono text-[10px] uppercase tracking-widest">Database Registry // 006</span>
          <h2 className="font-apex-sans text-2xl font-black text-apex-text mt-1 uppercase">Catalog Intelligence</h2>
        </div>
        <p className="text-xs text-apex-on-surface-variant/60 font-apex-mono hidden sm:block">SYSTEM_REGISTRIES // TELEMETRY_DAEMON</p>
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
