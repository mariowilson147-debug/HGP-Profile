"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getProducts, type Product } from "@/lib/actions";
import { Loader2, ShoppingCart, Search, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";

export default function ProcurementView({ branchId, returnPath = "/manager" }: { branchId?: string | null, returnPath?: string }) {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();
  
  // For admin mode
  const [adminBranchId, setAdminBranchId] = useState<string>("");
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  
  const selectedBranchId = branchId || adminBranchId;

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    supabase.from('branches').select('id, name').then(({data}) => {
      if (data) {
        setBranches(data);
        if (!branchId && data.length > 0) setAdminBranchId(data[0].id);
      }
    });
    getProducts().then(setProducts);
  }, [branchId, supabase]);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())).slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || !unitCost || !selectedBranchId) return;

    setIsSubmitting(true);
    try {
      const qty = parseInt(quantity);
      const cost = parseFloat(unitCost);
      const total = qty * cost;

      // 1. Record Purchase
      const { error: pError } = await supabase.from('purchases').insert([{
        branch_id: selectedBranchId,
        product_id: selectedProduct.id,
        quantity: qty,
        unit_cost: cost,
        total_cost: total
      }]);
      
      if (pError) console.warn("Purchases insert error:", pError);

      // 2. Increment Inventory
      const { data: invData } = await supabase.from('inventory').select('id, stock_level').eq('branch_id', selectedBranchId).eq('product_id', selectedProduct.id).single();
      
      if (invData) {
        await supabase.from('inventory').update({ stock_level: invData.stock_level + qty }).eq('id', invData.id);
      } else {
        await supabase.from('inventory').insert([{ branch_id: selectedBranchId, product_id: selectedProduct.id, stock_level: qty, reorder_level: 5 }]);
      }

      // 3. Update Product Buying Price (Cost)
      await supabase.from('products').update({ buying_price: cost }).eq('id', selectedProduct.id);

      setSuccessMsg(`Successfully restocked ${qty}x ${selectedProduct.name}`);
      setSelectedProduct(null);
      setQuantity("");
      setUnitCost("");
      setSearch("");
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to process purchase");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedBranchId && branchId !== undefined && branchId !== null) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-apex-text mb-2">No Branch Selected</h2>
        <p className="text-apex-on-surface-variant">Please select a branch first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href={returnPath} className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-display font-bold text-apex-text">Procurement</h1>
          </Link>
          <p className="text-apex-on-surface-variant mt-2">Record new stock purchases and restock branch inventory.</p>
        </div>
        
        {!branchId && (
          <div className="flex flex-col">
            <label className="text-xs font-bold text-apex-on-surface-variant uppercase tracking-wider mb-1">Select Receiving Branch</label>
            <select
              value={adminBranchId}
              onChange={(e) => setAdminBranchId(e.target.value)}
              className="px-4 py-2.5 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium min-w-[200px] text-apex-text"
            >
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="bg-apex-surface rounded-2xl border border-apex-outline shadow-sm p-6 min-h-[500px]">
        <div className="max-w-2xl">
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 size={20} />
              {successMsg}
            </div>
          )}

          {!selectedProduct ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-apex-text">Search Product to Restock</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-apex-surface-highest border border-apex-outline rounded-xl focus:ring-2 focus:ring-apex-text outline-none"
                />
              </div>
              
              {search && (
                <div className="border border-apex-outline rounded-xl overflow-hidden divide-y divide-apex-outline-variant">
                  {filtered.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => { setSelectedProduct(p); setUnitCost(p.buying_price?.toString() || ""); }}
                      className="w-full flex items-center justify-between p-4 hover:bg-apex-surface-low transition-colors text-left"
                    >
                      <div>
                        <div className="font-bold text-apex-text">{p.name}</div>
                        <div className="text-sm text-apex-on-surface-variant">SKU: {p.sku || 'N/A'} | Curr. Cost: KES {p.buying_price}</div>
                      </div>
                      <Plus className="text-apex-on-surface-variant" size={20} />
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="p-4 text-center text-apex-on-surface-variant">No products found. <Link href="/admin/products" className="text-blue-600 font-medium hover:underline">Create a new item in Admin.</Link></div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between p-4 bg-apex-surface-highest rounded-xl border border-apex-outline">
                <div>
                  <div className="font-bold text-apex-text">{selectedProduct.name}</div>
                  <div className="text-sm text-apex-on-surface-variant">Selected Product</div>
                </div>
                <button type="button" onClick={() => setSelectedProduct(null)} className="text-sm font-medium text-blue-600 hover:underline">Change</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-apex-text mb-2">Quantity Bought</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full px-4 py-3 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-apex-text outline-none text-apex-text"
                    placeholder="e.g. 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-apex-text mb-2">Unit Cost (Buying Price KES)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    required
                    value={unitCost}
                    onChange={e => setUnitCost(e.target.value)}
                    className="w-full px-4 py-3 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-apex-text outline-none text-apex-text"
                    placeholder="Cost per item"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 text-blue-900 rounded-xl text-sm">
                <span className="font-bold">Total Cost: </span> 
                KES {((parseInt(quantity) || 0) * (parseFloat(unitCost) || 0)).toLocaleString()}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 hover:bg-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 bg-apex-surface-highest text-apex-text"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Confirm Restock
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
