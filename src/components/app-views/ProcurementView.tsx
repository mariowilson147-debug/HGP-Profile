"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getProducts, type Product } from "@/lib/actions";
import { Loader2, Search, CheckCircle2, Plus, Clock, ShoppingCart, PackageOpen, Minus, Trash2, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import DatePicker from "@/components/ui/DatePicker";

interface BranchInventory {
  stock_level: number;
  branch_buying_price?: number;
  branch_wholesale_price?: number;
  branch_retail_price?: number;
}

interface CartItem extends Product {
  restock_qty: number;
  unit_cost: number;
  wholesale_price: number;
  retail_price: number;
  current_stock: number;
}

interface PurchaseRecord {
  id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
  products?: { name: string };
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
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<'restock' | 'history'>('restock');

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

    // Purchases with Date Range
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    const { data: purData } = await supabase.from('purchases')
      .select(`
        id, 
        created_at, 
        purchase_items(
          quantity, 
          unit_cost, 
          subtotal, 
          products(name)
        )
      `)
      .eq('branch_id', selectedBranchId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });
      
    if (purData) {
      const flatPurchases = (purData as any[]).flatMap(pur => 
        (pur.purchase_items || []).map((item: any, idx: number) => ({
          id: `${pur.id}-${idx}`,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_cost: item.subtotal,
          created_at: pur.created_at,
          products: item.products
        }))
      );
      setPurchases(flatPurchases);
    }
  };

  useEffect(() => {
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
  }, [selectedBranchId, fromDate, toDate, supabase]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev; // Already in cart

      const inv = inventory[product.id];
      return [...prev, { 
        ...product, 
        restock_qty: 1,
        unit_cost: inv?.branch_buying_price ?? product.buying_price ?? 0,
        wholesale_price: inv?.branch_wholesale_price ?? product.wholesale_price ?? 0,
        retail_price: inv?.branch_retail_price ?? product.retail_price ?? 0,
        current_stock: inv?.stock_level ?? 0
      }];
    });
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !selectedBranchId || !user) return;
    setIsProcessing(true);

    try {
      // 1. Create Purchase Header
      const totalAmount = cart.reduce((sum, item) => sum + (item.restock_qty * item.unit_cost), 0);
      const { data: purchaseData, error: pError } = await supabase.from('purchases').insert([{
        branch_id: selectedBranchId,
        manager_id: user.id,
        total_amount: totalAmount,
        status: 'completed'
      }]).select().single();

      if (pError) throw pError;
      const purchaseId = purchaseData.id;

      // 2. Insert Items and Update Inventory
      for (const item of cart) {
        const subtotal = item.restock_qty * item.unit_cost;
        
        // Add to purchase_items
        const { error: iError } = await supabase.from('purchase_items').insert([{
          purchase_id: purchaseId,
          product_id: item.id,
          quantity: item.restock_qty,
          unit_cost: item.unit_cost,
          subtotal: subtotal
        }]);
        if (iError) throw iError;

        // Update inventory
        const currentInv = inventory[item.id];
        const newStock = (currentInv?.stock_level || 0) + item.restock_qty;
        
        if (currentInv) {
          await supabase.from('inventory').update({ 
            stock_level: newStock,
            branch_buying_price: item.unit_cost,
            branch_wholesale_price: item.wholesale_price,
            branch_retail_price: item.retail_price
          }).eq('branch_id', selectedBranchId).eq('product_id', item.id);
        } else {
          await supabase.from('inventory').insert([{ 
            branch_id: selectedBranchId, 
            product_id: item.id, 
            stock_level: newStock, 
            reorder_level: 5,
            branch_buying_price: item.unit_cost,
            branch_wholesale_price: item.wholesale_price,
            branch_retail_price: item.retail_price 
          }]);
        }
      }

      setSuccessMsg("Restock processed successfully!");
      setCart([]);
      setTimeout(() => setSuccessMsg(""), 3000);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to process restock. See console for details.");
    } finally {
      setIsProcessing(false);
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
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));
  const filteredPurchases = purchases.filter(p => p.products?.name.toLowerCase().includes(historySearch.toLowerCase()));

  const totalCartCost = cart.reduce((sum, item) => sum + (item.unit_cost * item.restock_qty), 0);

  return (
    <div className="space-y-6 pb-12">
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

      <div className="flex gap-4 border-b border-apex-outline">
        <button 
          onClick={() => setActiveTab('restock')}
          className={`py-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'restock' ? 'border-apex-primary text-apex-primary' : 'border-transparent text-apex-on-surface-variant hover:text-apex-text'}`}
        >
          <ShoppingCart className="inline-block mr-2" size={18} /> Bulk Restock
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`py-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-apex-primary text-apex-primary' : 'border-transparent text-apex-on-surface-variant hover:text-apex-text'}`}
        >
          <Clock className="inline-block mr-2" size={18} /> Purchase History
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 font-medium border border-green-200">
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      {activeTab === 'restock' && (
        <div className="bg-apex-surface rounded-2xl border border-apex-outline shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          {/* Search Bar Area */}
          <div className="p-6 border-b border-apex-outline bg-apex-surface-highest">
            <h2 className="text-lg font-bold text-apex-text mb-4 flex items-center gap-2">
              <Search size={20} className="text-apex-on-surface-variant" /> Search & Add to Restock List
            </h2>
            <div className="relative max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant" size={18} />
                <input 
                  type="text" 
                  placeholder="Type product name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-apex-text outline-none shadow-sm text-apex-text"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-apex-on-surface-variant hover:text-apex-text rounded-full hover:bg-apex-surface-low transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {search && (
                <div className="absolute z-10 w-full mt-2 bg-apex-surface border border-apex-outline rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-apex-on-surface-variant">No products found.</div>
                  ) : (
                    filteredProducts.map(product => {
                      const stock = inventory[product.id]?.stock_level || 0;
                      const isSelected = cart.some(c => c.id === product.id);
                      return (
                        <button
                          key={product.id}
                          onClick={() => { addToCart(product); setSearch(""); }}
                          disabled={isSelected}
                          className={`w-full text-left p-3 border-b border-apex-outline hover:bg-apex-surface-low flex justify-between items-center transition-colors ${isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div>
                            <div className="font-bold text-apex-text">{product.name}</div>
                            <div className="text-xs text-apex-on-surface-variant">SKU: {product.sku || 'N/A'}</div>
                          </div>
                          <div className="text-sm font-medium text-apex-on-surface-variant">
                            {stock} in stock {isSelected && <span className="ml-2 text-xs bg-slate-100 px-2 py-1 rounded">Added</span>}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart Table Area */}
          <div className="flex-1 p-0 overflow-x-auto">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-apex-on-surface-variant space-y-4">
                <PackageOpen size={48} strokeWidth={1.5} className="opacity-50" />
                <p>Search and tap products above to start restocking.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-apex-on-surface-variant text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold border-b border-apex-outline">Product</th>
                    <th className="py-3 px-4 font-bold text-center border-b border-apex-outline">Available</th>
                    <th className="py-3 px-4 font-bold border-b border-apex-outline">Qty Purchasing</th>
                    <th className="py-3 px-4 font-bold border-b border-apex-outline">Cost (KES)</th>
                    <th className="py-3 px-4 font-bold border-b border-apex-outline">Wholesale (KES)</th>
                    <th className="py-3 px-4 font-bold border-b border-apex-outline">Retail (KES)</th>
                    <th className="py-3 px-4 font-bold text-right border-b border-apex-outline">Total Value</th>
                    <th className="py-3 px-4 font-bold text-center border-b border-apex-outline">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apex-outline">
                  {cart.map(item => (
                    <tr key={item.id} className="hover:bg-apex-surface-low transition-colors group">
                      <td className="py-3 px-4">
                        <div className="font-bold text-sm text-apex-text">{item.name}</div>
                        <div className="text-xs text-apex-on-surface-variant">SKU: {item.sku || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-apex-text">{item.current_stock}</td>
                      <td className="py-3 px-4">
                        <input 
                          type="number" min="1" 
                          value={item.restock_qty || ''} 
                          onChange={(e) => updateCartItem(item.id, { restock_qty: parseInt(e.target.value) || 0 })} 
                          className="w-20 px-2 py-1.5 bg-apex-surface border border-apex-outline rounded-lg text-sm outline-none focus:border-apex-primary text-apex-text" 
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input 
                          type="number" step="0.01" 
                          value={item.unit_cost || ''} 
                          onChange={(e) => updateCartItem(item.id, { unit_cost: parseFloat(e.target.value) || 0 })} 
                          className="w-24 px-2 py-1.5 bg-apex-surface border border-apex-outline rounded-lg text-sm outline-none focus:border-apex-primary text-apex-text" 
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input 
                          type="number" step="0.01" 
                          value={item.wholesale_price || ''} 
                          onChange={(e) => updateCartItem(item.id, { wholesale_price: parseFloat(e.target.value) || 0 })} 
                          className="w-24 px-2 py-1.5 bg-apex-surface border border-apex-outline rounded-lg text-sm outline-none focus:border-apex-primary text-apex-text" 
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input 
                          type="number" step="0.01" 
                          value={item.retail_price || ''} 
                          onChange={(e) => updateCartItem(item.id, { retail_price: parseFloat(e.target.value) || 0 })} 
                          className="w-24 px-2 py-1.5 bg-apex-surface border border-apex-outline rounded-lg text-sm outline-none focus:border-apex-primary text-apex-text" 
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-apex-text">
                        {(item.unit_cost * item.restock_qty).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="text-apex-on-surface-variant hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-apex-outline bg-apex-surface-highest flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-apex-on-surface-variant font-medium block">Total Restock Value</span>
                <span className="text-3xl font-display font-bold text-apex-text tracking-tight">
                  KES {totalCartCost.toLocaleString()}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="px-8 py-3.5 bg-apex-primary text-apex-bg rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98] w-full sm:w-auto"
              >
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : "Process Restock"}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-apex-surface rounded-2xl border border-apex-outline shadow-sm overflow-hidden min-h-[600px]">
          <div className="p-5 border-b border-apex-outline flex flex-col md:flex-row gap-4 justify-between items-center bg-apex-surface-highest">
            <div className="flex items-center gap-4">
              <DatePicker date={fromDate} setDate={setFromDate} label="From Date" />
              <DatePicker date={toDate} setDate={setToDate} label="To Date" />
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant" size={16} />
              <input 
                type="text" 
                placeholder="Search by item name..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-apex-text outline-none text-sm"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-apex-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold border-b border-apex-outline">Date & Time</th>
                  <th className="py-3 px-4 font-bold border-b border-apex-outline">Product</th>
                  <th className="py-3 px-4 font-bold text-center border-b border-apex-outline">Quantity</th>
                  <th className="py-3 px-4 font-bold text-right border-b border-apex-outline">Unit Cost (KES)</th>
                  <th className="py-3 px-4 font-bold text-right border-b border-apex-outline">Total (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apex-outline-variant">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-apex-on-surface-variant">
                      No purchase history found for selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map(pur => (
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
      )}
    </div>
  );
}
