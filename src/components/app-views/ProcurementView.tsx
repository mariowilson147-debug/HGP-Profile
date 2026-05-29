"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getProducts, type Product } from "@/lib/actions";
import { Loader2, Search, CheckCircle2, Plus, Clock, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface BranchInventory {
  stock_level: number;
  branch_buying_price?: number;
  branch_wholesale_price?: number;
  branch_retail_price?: number;
}

function ProcurementRow({ 
  product, 
  inventoryData, 
  onProcure, 
  isSubmitting 
}: { 
  product: Product; 
  inventoryData?: BranchInventory; 
  onProcure: (productId: string, qty: number, cost: number, wholesale: number, retail: number) => void;
  isSubmitting: boolean;
}) {
  const stockLevel = inventoryData?.stock_level || 0;
  const initialCost = inventoryData?.branch_buying_price ?? product.buying_price;
  const initialWholesale = inventoryData?.branch_wholesale_price ?? product.wholesale_price;
  const initialRetail = inventoryData?.branch_retail_price ?? product.retail_price;

  const [qty, setQty] = useState("");
  const [cost, setCost] = useState(initialCost?.toString() || "");
  const [wholesale, setWholesale] = useState(initialWholesale?.toString() || "");
  const [retail, setRetail] = useState(initialRetail?.toString() || "");

  // Update inputs if branch inventory data changes (e.g., after selecting a different branch)
  useEffect(() => {
    setCost(initialCost?.toString() || "");
    setWholesale(initialWholesale?.toString() || "");
    setRetail(initialRetail?.toString() || "");
  }, [initialCost, initialWholesale, initialRetail]);

  return (
    <tr className="border-b border-apex-outline hover:bg-apex-surface-low transition-colors">
      <td className="py-3 px-4">
        <div className="font-bold text-apex-text">{product.name}</div>
        <div className="text-xs text-apex-on-surface-variant">SKU: {product.sku || 'N/A'}</div>
      </td>
      <td className="py-3 px-4 text-apex-text text-center font-bold">
        {stockLevel}
      </td>
      <td className="py-3 px-4">
        <input 
          type="number" min="1" placeholder="Qty" value={qty} onChange={e => setQty(e.target.value)}
          className="w-16 px-2 py-1.5 bg-apex-surface border border-apex-outline rounded-lg focus:ring-2 focus:ring-apex-text outline-none text-apex-text text-sm"
        />
      </td>
      <td className="py-3 px-4">
        <input 
          type="number" min="0" step="0.01" placeholder="Cost" value={cost} onChange={e => setCost(e.target.value)}
          className="w-20 px-2 py-1.5 bg-apex-surface border border-apex-outline rounded-lg focus:ring-2 focus:ring-apex-text outline-none text-apex-text text-sm"
        />
      </td>
      <td className="py-3 px-4">
        <input 
          type="number" min="0" step="0.01" placeholder="Wholesale" value={wholesale} onChange={e => setWholesale(e.target.value)}
          className="w-24 px-2 py-1.5 bg-apex-surface border border-apex-outline rounded-lg focus:ring-2 focus:ring-apex-text outline-none text-apex-text text-sm"
        />
      </td>
      <td className="py-3 px-4">
        <input 
          type="number" min="0" step="0.01" placeholder="Retail" value={retail} onChange={e => setRetail(e.target.value)}
          className="w-24 px-2 py-1.5 bg-apex-surface border border-apex-outline rounded-lg focus:ring-2 focus:ring-apex-text outline-none text-apex-text text-sm"
        />
      </td>
      <td className="py-3 px-4 text-right">
        <button 
          disabled={isSubmitting || !qty || parseInt(qty) <= 0 || !cost || !wholesale || !retail}
          onClick={() => {
            onProcure(product.id, parseInt(qty), parseFloat(cost), parseFloat(wholesale), parseFloat(retail));
            setQty(""); // Reset qty after click
          }}
          className="px-3 py-1.5 bg-apex-primary text-apex-bg rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center min-w-[80px]"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Procure"}
        </button>
      </td>
    </tr>
  );
}

export default function ProcurementView({ 
  branchId, 
  availableBranches, 
  returnPath = "/manager" 
}: { 
  branchId?: string | null, 
  availableBranches?: {id: string, name: string}[],
  returnPath?: string 
}) {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();
  
  const [activeBranchId, setActiveBranchId] = useState<string>(branchId || "");
  const [branches, setBranches] = useState<{id: string, name: string}[]>(availableBranches || []);
  
  const selectedBranchId = activeBranchId;

  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Record<string, BranchInventory>>({});
  
  interface PurchaseRecord {
    id: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    created_at: string;
    products?: { name: string };
  }
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  
  const [search, setSearch] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    if (!selectedBranchId) return;
    
    // Inventory
    const { data: invData } = await supabase.from('inventory')
      .select('product_id, stock_level, branch_buying_price, branch_wholesale_price, branch_retail_price')
      .eq('branch_id', selectedBranchId);
      
    const invMap: Record<string, BranchInventory> = {};
    if (invData) {
      invData.forEach(inv => {
        invMap[inv.product_id] = {
          stock_level: inv.stock_level,
          branch_buying_price: inv.branch_buying_price,
          branch_wholesale_price: inv.branch_wholesale_price,
          branch_retail_price: inv.branch_retail_price
        };
      });
    }
    setInventory(invMap);

    // Purchases
    const { data: purData } = await supabase.from('purchases')
      .select('id, quantity, unit_cost, total_cost, created_at, products(name)')
      .eq('branch_id', selectedBranchId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (purData) setPurchases(purData as unknown as PurchaseRecord[]);
  };

  useEffect(() => {
    // If availableBranches is provided (Manager), we use them.
    // Otherwise (Admin), we fetch all branches.
    if (!availableBranches) {
      supabase.from('branches').select('id, name').then(({data}) => {
        if (data) {
          setBranches(data);
          if (!activeBranchId && data.length > 0) setActiveBranchId(data[0].id);
        }
      });
    } else {
      setBranches(availableBranches);
      if (!activeBranchId && availableBranches.length > 0) setActiveBranchId(availableBranches[0].id);
    }
    getProducts().then(setProducts);
  }, [availableBranches, supabase]);

  useEffect(() => {
    loadData();
  }, [selectedBranchId, supabase]);

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 10);

  const handleProcure = async (productId: string, qty: number, cost: number, wholesale: number, retail: number) => {
    if (!selectedBranchId) return;
    setSubmittingId(productId);
    try {
      const total = qty * cost;
      
      const { error: pError } = await supabase.from('purchases').insert([{
        branch_id: selectedBranchId,
        product_id: productId,
        quantity: qty,
        unit_cost: cost,
        total_cost: total
      }]);
      if (pError) console.warn("Purchases insert error:", pError);

      const currentInv = inventory[productId];
      const currentStock = currentInv?.stock_level || 0;
      
      if (currentInv) {
        await supabase.from('inventory').update({ 
          stock_level: currentStock + qty,
          branch_buying_price: cost,
          branch_wholesale_price: wholesale,
          branch_retail_price: retail
        }).eq('branch_id', selectedBranchId).eq('product_id', productId);
      } else {
        await supabase.from('inventory').insert([{ 
          branch_id: selectedBranchId, 
          product_id: productId, 
          stock_level: qty, 
          reorder_level: 5,
          branch_buying_price: cost,
          branch_wholesale_price: wholesale,
          branch_retail_price: retail 
        }]);
      }

      // DO NOT update global products table anymore to prevent interfering with catalogue prices.

      const prodName = products.find(p => p.id === productId)?.name || 'Item';
      setSuccessMsg(`Successfully restocked ${qty}x ${prodName} and updated pricing.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      
      loadData(); // Refresh inventory and purchases
    } catch (err) {
      console.error(err);
      alert("Failed to process purchase");
    } finally {
      setSubmittingId(null);
    }
  };

  if (!selectedBranchId && branchId !== undefined && branchId !== null && (!availableBranches || availableBranches.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-apex-text mb-2">No Branch Selected</h2>
        <p className="text-apex-on-surface-variant">Please select a branch first.</p>
      </div>
    );
  }

  const addProductLink = branchId ? '/manager/product/new' : '/admin/product/new';

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href={returnPath} className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-display font-bold text-apex-text">Procurement</h1>
          </Link>
          <p className="text-apex-on-surface-variant mt-2">Restock inventory and set branch-specific pricing.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-apex-on-surface-variant uppercase tracking-wider mb-1">Select Receiving Branch</label>
            <select
              value={activeBranchId}
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="px-4 py-2.5 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium min-w-[200px] text-apex-text"
            >
              {branches.length === 0 && <option disabled value="">No branches available</option>}
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          
          <Link 
            href={addProductLink}
            className="px-5 py-2.5 bg-apex-primary text-apex-bg rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2 self-end h-[42px]"
          >
            <Plus size={18} /> Add Product
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 font-medium border border-green-200">
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      {/* Procurement Table Area */}
      <div className="bg-apex-surface rounded-2xl border border-apex-outline shadow-sm overflow-hidden">
        <div className="p-6 border-b border-apex-outline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-apex-text flex items-center gap-2">
            <ShoppingCart size={20} className="text-apex-on-surface-variant" /> Quick Procure
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant" size={16} />
            <input 
              type="text" 
              placeholder="Search product to restock..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-apex-surface-highest border border-apex-outline rounded-xl focus:ring-2 focus:ring-apex-text outline-none text-apex-text text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-apex-surface-highest text-apex-on-surface-variant text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Product</th>
                <th className="py-3 px-4 font-bold text-center">In Stock</th>
                <th className="py-3 px-4 font-bold">Qty</th>
                <th className="py-3 px-4 font-bold">Unit Cost</th>
                <th className="py-3 px-4 font-bold">Wholesale</th>
                <th className="py-3 px-4 font-bold">Retail</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <ProcurementRow 
                  key={p.id} 
                  product={p} 
                  inventoryData={inventory[p.id]} 
                  onProcure={handleProcure}
                  isSubmitting={submittingId === p.id}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-apex-on-surface-variant">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-apex-surface rounded-2xl border border-apex-outline shadow-sm overflow-hidden">
        <div className="p-6 border-b border-apex-outline">
          <h2 className="text-lg font-bold text-apex-text flex items-center gap-2">
            <Clock size={20} className="text-apex-on-surface-variant" /> Recent Purchases
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-apex-surface-highest text-apex-on-surface-variant text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Date & Time</th>
                <th className="py-3 px-4 font-bold">Product</th>
                <th className="py-3 px-4 font-bold text-center">Quantity</th>
                <th className="py-3 px-4 font-bold text-right">Unit Cost (KES)</th>
                <th className="py-3 px-4 font-bold text-right">Total (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apex-outline-variant">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-apex-on-surface-variant">
                    No purchase history found for this branch.
                  </td>
                </tr>
              ) : (
                purchases.map(pur => (
                  <tr key={pur.id} className="hover:bg-apex-surface-low transition-colors">
                    <td className="py-3 px-4 text-sm text-apex-text">
                      {new Date(pur.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-apex-text">
                      {pur.products?.name || 'Unknown Product'}
                    </td>
                    <td className="py-3 px-4 text-sm text-apex-text text-center font-medium">
                      {pur.quantity}
                    </td>
                    <td className="py-3 px-4 text-sm text-apex-text text-right">
                      {Number(pur.unit_cost).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-apex-text text-right">
                      {Number(pur.total_cost).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
