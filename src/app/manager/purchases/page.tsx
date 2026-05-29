"use client";

import React, { useState, useEffect } from "react";
import { useManagerBranch } from "@/components/ManagerBranchProvider";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getProducts, getDbCategories, addProducts, type Product, type Category } from "@/lib/actions";
import { Loader2, ShoppingCart, History, List, Plus, Search, CheckCircle2, Package, ChevronDown, ChevronUp, X } from "lucide-react";
import Link from "next/link";
import DatePicker from "@/components/ui/DatePicker";
import SelectDropdown from "@/components/ui/SelectDropdown";

type TabType = "create" | "summary" | "items";

export default function ManagerPurchasesPage() {
  const { selectedBranchId, availableBranches } = useManagerBranch();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("create");
  const branchName = availableBranches.find(b => b.id === selectedBranchId)?.name || "Selected Branch";

  if (!selectedBranchId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Branch Selected</h2>
        <p className="text-slate-500">Please select a branch from the dashboard first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <Link href="/manager" className="hover:opacity-80 transition-opacity">
          <h1 className="text-3xl font-display font-bold text-slate-900">Procurements & Purchases</h1>
        </Link>
        <p className="text-slate-500 mt-2">Manage incoming stock and purchase history for <span className="font-semibold">{branchName}</span>.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: "create", label: "Create Purchase", icon: ShoppingCart },
          { id: "summary", label: "Summary History", icon: History },
          { id: "items", label: "Item History", icon: List },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-slate-900 text-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[500px]">
        {activeTab === "create" && <CreatePurchaseTab branchId={selectedBranchId} userId={user?.id} />}
        {activeTab === "summary" && <SummaryHistoryTab branchId={selectedBranchId} />}
        {activeTab === "items" && <ItemHistoryTab branchId={selectedBranchId} />}
      </div>
    </div>
  );
}

// ─── Create Purchase Tab ──────────────────────────────────────────────────────
type CartItem = {
  product: Product;
  quantity: number;
  unitCost: number;
};

function CreatePurchaseTab({ branchId, userId }: { branchId: string; userId?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const supabase = createSupabaseBrowserClient();

  // Quick Add Product state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: "",
    sku: "",
    category: "",
    buying_price: "",
    wholesale_price: "",
    retail_price: ""
  });
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts);
    getDbCategories().then(setCategories);
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())).slice(0, 5);

  const addToCart = (product: Product) => {
    if (cart.find(c => c.product.id === product.id)) return;
    setCart([...cart, { product, quantity: 1, unitCost: product.buying_price || 0 }]);
    setSearch("");
  };

  const updateCart = (index: number, field: 'quantity' | 'unitCost', value: string) => {
    const newCart = [...cart];
    newCart[index][field] = parseFloat(value) || 0;
    setCart(newCart);
  };

  const removeCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

  const handleSubmit = async () => {
    if (cart.length === 0 || !userId) return;
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      // 1. Create header record
      const { data: purchase, error: pError } = await supabase.from('purchases').insert([{
        branch_id: branchId,
        manager_id: userId,
        total_amount: totalAmount,
        status: 'completed'
      }]).select().single();

      if (pError || !purchase) throw pError || new Error("Failed to create purchase record");

      // 2. Create items & update inventory & update buying price
      const itemInserts = [];
      
      for (const item of cart) {
        itemInserts.push({
          purchase_id: purchase.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          subtotal: item.quantity * item.unitCost
        });

        // Update Inventory
        const { data: invData } = await supabase.from('inventory').select('id, stock_level').eq('branch_id', branchId).eq('product_id', item.product.id).single();
        if (invData) {
          await supabase.from('inventory').update({ stock_level: invData.stock_level + item.quantity }).eq('id', invData.id);
        } else {
          await supabase.from('inventory').insert([{ branch_id: branchId, product_id: item.product.id, stock_level: item.quantity, reorder_level: 5 }]);
        }

        // Update Product buying price
        await supabase.from('products').update({ buying_price: item.unitCost }).eq('id', item.product.id);
      }

      await supabase.from('purchase_items').insert(itemInserts);

      setSuccessMsg("Purchase successfully recorded and inventory updated.");
      setCart([]);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: unknown) {
      console.error(err);
      alert((err as Error).message || "Failed to process purchase. Did you run the SQL script?");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAddProduct = async () => {
    if (!quickAddData.name || !quickAddData.category) return;
    setIsQuickAdding(true);
    try {
      const cost = parseFloat(quickAddData.buying_price) || 0;
      await addProducts([{
        name: quickAddData.name,
        sku: quickAddData.sku,
        category: quickAddData.category,
        buying_price: cost,
        wholesale_price: parseFloat(quickAddData.wholesale_price) || cost,
        retail_price: parseFloat(quickAddData.retail_price) || cost,
        image_url: '',
        visibility: 'visible',
        is_featured: false,
        tags: [],
        attributes: {},
        availability: 'in_stock',
        sort_order: 0
      }]);
      // Refetch products
      const newProducts = await getProducts();
      setProducts(newProducts);
      // Find the newly created product and add to cart
      const createdProduct = newProducts.find(p => p.name === quickAddData.name && p.category === quickAddData.category);
      if (createdProduct) {
        addToCart(createdProduct);
      }
      setShowQuickAdd(false);
      setQuickAddData({ name: "", sku: "", category: "", buying_price: "", wholesale_price: "", retail_price: "" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to create product");
    } finally {
      setIsQuickAdding(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="font-bold text-slate-900 mb-4">Select Products</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>
        
        {search && (
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {filtered.map(p => (
              <button 
                key={p.id}
                onClick={() => addToCart(p)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div>
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-sm text-slate-500">SKU: {p.sku || 'N/A'} | Cost: KES {p.buying_price}</div>
                </div>
                <Plus className="text-slate-400" size={20} />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <p className="mb-4">No products found for &quot;{search}&quot;.</p>
                <button 
                  onClick={() => {
                    setQuickAddData({ ...quickAddData, name: search });
                    setShowQuickAdd(true);
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <Plus size={16} />
                  Create New Product
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold text-slate-900 mb-4">Purchase Cart</h2>
        {successMsg && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 size={20} />
            {successMsg}
          </div>
        )}
        
        {cart.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500">
            <Package className="mx-auto mb-2 text-slate-300" size={32} />
            Search and add products to start a purchase
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item, idx) => (
              <div key={item.product.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-bold text-slate-900">{item.product.name}</div>
                  <button onClick={() => removeCart(idx)} className="text-red-500 text-sm font-medium hover:underline">Remove</button>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                    <input 
                      type="number" min="1" value={item.quantity} 
                      onChange={e => updateCart(idx, 'quantity', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-slate-900"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Unit Cost (KES)</label>
                    <input 
                      type="number" min="0" step="0.01" value={item.unitCost} 
                      onChange={e => updateCart(idx, 'unitCost', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center">
              <span className="font-medium text-slate-300">Total Purchase Value</span>
              <span className="font-bold text-xl">KES {totalAmount.toLocaleString()}</span>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Confirm Purchase
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Quick Add Product</h3>
              <button onClick={() => setShowQuickAdd(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                <input 
                  type="text" 
                  value={quickAddData.name}
                  onChange={e => setQuickAddData({...quickAddData, name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Red Roses"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                <input 
                  type="text" 
                  value={quickAddData.sku}
                  onChange={e => setQuickAddData({...quickAddData, sku: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <SelectDropdown
                  value={quickAddData.category}
                  onChange={(val) => setQuickAddData({...quickAddData, category: val})}
                  options={categories.map(c => ({ label: c.name, value: c.name }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit Cost (KES) *</label>
                <input 
                  type="number" min="0" step="0.01"
                  value={quickAddData.buying_price}
                  onChange={e => setQuickAddData({...quickAddData, buying_price: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wholesale Price (KES)</label>
                <input 
                  type="number" min="0" step="0.01"
                  value={quickAddData.wholesale_price}
                  onChange={e => setQuickAddData({...quickAddData, wholesale_price: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Defaults to Unit Cost"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Retail Price (KES)</label>
                <input 
                  type="number" min="0" step="0.01"
                  value={quickAddData.retail_price}
                  onChange={e => setQuickAddData({...quickAddData, retail_price: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Defaults to Unit Cost"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowQuickAdd(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleQuickAddProduct}
                disabled={isQuickAdding || !quickAddData.name || !quickAddData.category}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isQuickAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Summary History Tab ──────────────────────────────────────────────────────
function SummaryHistoryTab({ branchId }: { branchId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function fetchPurchases() {
      setLoading(true);
      const start = new Date(fromDate); start.setHours(0,0,0,0);
      const end = new Date(toDate); end.setHours(23,59,59,999);

      const { data } = await supabase
        .from('purchases')
        .select(`
          id, created_at, total_amount, status,
          user_profiles ( nickname ),
          purchase_items ( id, quantity, unit_cost, subtotal, products ( name, sku ) )
        `)
        .eq('branch_id', branchId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });
      
      if (data) setPurchases(data);
      setLoading(false);
    }
    fetchPurchases();
  }, [branchId, fromDate, toDate, supabase]);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-fit">
        <DatePicker date={fromDate} setDate={setFromDate} label="From Date" />
        <DatePicker date={toDate} setDate={setToDate} label="To Date" />
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
          <tr>
            <th className="p-4 font-medium">Date</th>
            <th className="p-4 font-medium">Purchase ID</th>
            <th className="p-4 font-medium">Recorded By</th>
            <th className="p-4 font-medium text-right">Total Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {purchases.map(p => {
            const isExpanded = expandedId === p.id;
            return (
            <React.Fragment key={p.id}>
              <tr onClick={() => setExpandedId(isExpanded ? null : p.id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="p-4 text-slate-600">
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                </td>
                <td className="p-4 font-mono text-xs text-slate-400">{p.id.split('-')[0]}</td>
                <td className="p-4 font-medium text-slate-900">{p.user_profiles?.nickname || 'Unknown'}</td>
                <td className="p-4 text-right font-bold text-slate-900">KES {p.total_amount.toLocaleString()}</td>
              </tr>
              {isExpanded && p.purchase_items && p.purchase_items.length > 0 && (
                <tr className="bg-slate-50 border-t border-slate-100">
                  <td colSpan={4} className="p-4">
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="p-3 font-medium">Product</th>
                            <th className="p-3 font-medium text-right">Qty</th>
                            <th className="p-3 font-medium text-right">Unit Cost</th>
                            <th className="p-3 font-medium text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {p.purchase_items.map((item: any) => (
                            <tr key={item.id}>
                              <td className="p-3">
                                <div className="font-bold text-slate-900">{item.products?.name}</div>
                                <div className="text-slate-500">{item.products?.sku}</div>
                              </td>
                              <td className="p-3 text-right font-medium">{item.quantity}</td>
                              <td className="p-3 text-right text-slate-600">KES {item.unit_cost.toLocaleString()}</td>
                              <td className="p-3 text-right font-bold text-slate-900">KES {item.subtotal.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          )})}
          {purchases.length === 0 && (
            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No purchase history found.</td></tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

// ─── Item History Tab ─────────────────────────────────────────────────────────
function ItemHistoryTab({ branchId }: { branchId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      const start = new Date(fromDate); start.setHours(0,0,0,0);
      const end = new Date(toDate); end.setHours(23,59,59,999);

      // Need to join purchases to filter by branch_id
      const { data } = await supabase
        .from('purchase_items')
        .select(`
          id, quantity, unit_cost, subtotal,
          products ( name, sku ),
          purchases!inner ( created_at, branch_id )
        `)
        .eq('purchases.branch_id', branchId)
        .gte('purchases.created_at', start.toISOString())
        .lte('purchases.created_at', end.toISOString())
        .order('purchases(created_at)', { ascending: false });
      
      if (data) setItems(data);
      setLoading(false);
    }
    fetchItems();
  }, [branchId, fromDate, toDate, supabase]);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  const filteredItems = items.filter(i => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (i.products?.name || "").toLowerCase().includes(q) ||
      (i.products?.sku || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-fit">
          <DatePicker date={fromDate} setDate={setFromDate} label="From Date" />
          <DatePicker date={toDate} setDate={setToDate} label="To Date" />
        </div>
        <div className="relative w-full sm:w-64 self-end sm:self-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2ab6eb] outline-none text-sm transition-all shadow-sm h-[60px]"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
          <tr>
            <th className="p-4 font-medium">Date</th>
            <th className="p-4 font-medium">Product</th>
            <th className="p-4 font-medium text-right">Qty</th>
            <th className="p-4 font-medium text-right">Unit Cost</th>
            <th className="p-4 font-medium text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredItems.map(item => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="p-4 text-slate-600">{new Date(item.purchases.created_at).toLocaleDateString()}</td>
              <td className="p-4">
                <div className="font-bold text-slate-900">{item.products?.name}</div>
                <div className="text-xs text-slate-500">{item.products?.sku}</div>
              </td>
              <td className="p-4 text-right text-slate-600">{item.quantity}</td>
              <td className="p-4 text-right text-slate-600">KES {item.unit_cost.toLocaleString()}</td>
              <td className="p-4 text-right font-medium text-slate-900">KES {item.subtotal.toLocaleString()}</td>
            </tr>
          ))}
          {filteredItems.length === 0 && (
            <tr><td colSpan={5} className="p-8 text-center text-slate-500">No item history found.</td></tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
