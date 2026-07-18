"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useManagerBranch } from "@/components/ManagerBranchProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2, Plus, Users, ArrowRightLeft, ClipboardList, ShoppingCart, Search, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getProducts, type Product } from "@/lib/actions";

type TabType = "purchases" | "transfers" | "users" | "stocktake";

export default function ManagerActions() {
  const { user } = useAuth();
  const { selectedBranchId, availableBranches } = useManagerBranch();
  const [activeTab, setActiveTab] = useState<TabType>("purchases");
  const branchName = availableBranches.find(b => b.id === selectedBranchId)?.name || "Selected Branch";

  if (!selectedBranchId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Branch Selected</h2>
        <p className="text-slate-500">Please select a branch from the dashboard first.</p>
        <Link href="/manager" className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <Link href="/manager" className="hover:opacity-80 transition-opacity">
          <h1 className="text-3xl font-display font-bold text-slate-900">Manager Actions</h1>
        </Link>
        <p className="text-slate-500 mt-2">Manage operations, staff, and stock for <span className="font-semibold text-slate-700">{branchName}</span>.</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
        {[
          { id: "purchases", label: "Restock / Purchases", icon: ShoppingCart },
          { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
          { id: "users", label: "User Management", icon: Users },
          { id: "stocktake", label: "Stock Take", icon: ClipboardList }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[500px]">
        {activeTab === "purchases" && <PurchasesTab branchId={selectedBranchId} />}
        {activeTab === "transfers" && <TransfersTab branchId={selectedBranchId} />}
        {activeTab === "users" && <UsersTab branchId={selectedBranchId} />}
        {activeTab === "stocktake" && <StockTakeTab branchId={selectedBranchId} />}
      </div>
    </div>
  );
}

// ─── PURCHASES TAB ────────────────────────────────────────────────────────────
function PurchasesTab({ branchId }: { branchId: string }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())).slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || !unitCost || !branchId || !user) return;

    setIsSubmitting(true);
    try {
      const qty = parseInt(quantity);
      const cost = parseFloat(unitCost);

      const { error: rpcError } = await supabase.rpc('process_purchase', {
        p_branch_id: branchId,
        p_manager_id: user.id,
        p_items: [{
          product_id: selectedProduct.id,
          quantity: qty,
          unit_cost: cost,
        }],
      });

      if (rpcError) throw rpcError;

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

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Record New Stock (Purchase)</h2>
      
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      {!selectedProduct ? (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Search Product to Restock</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or SKU..."
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
                  onClick={() => { setSelectedProduct(p); setUnitCost(p.buying_price?.toString() || ""); }}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div>
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-sm text-slate-500">SKU: {p.sku || 'N/A'} | Curr. Cost: KES {p.buying_price}</div>
                  </div>
                  <Plus className="text-slate-400" size={20} />
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-4 text-center text-slate-500">No products found. <Link href="/admin/products" className="text-blue-600 font-medium hover:underline">Create a new item in Admin.</Link></div>
              )}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">{selectedProduct.name}</div>
              <div className="text-sm text-slate-500">Selected Product</div>
            </div>
            <button type="button" onClick={() => setSelectedProduct(null)} className="text-sm font-medium text-blue-600 hover:underline">Change</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Quantity Bought</label>
              <input 
                type="number" 
                min="1"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                placeholder="e.g. 50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Unit Cost (Buying Price KES)</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                required
                value={unitCost}
                onChange={e => setUnitCost(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
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
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            Confirm Restock
          </button>
        </form>
      )}
    </div>
  );
}

// ─── TRANSFERS TAB ────────────────────────────────────────────────────────────
function TransfersTab({ branchId }: { branchId: string }) {
  // Mock logic - ideally reuse seller/actions logic
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Stock Transfers</h2>
      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-500">
        <ArrowRightLeft size={32} className="mx-auto mb-3 text-slate-300" />
        <p>No pending transfers for this branch.</p>
      </div>
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────
type UserProfile = {
  id: string;
  nickname: string;
  role: string;
  branch_id: string;
};

function UsersTab({ branchId }: { branchId: string }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function fetchBranchUsers() {
      // In a real app, you'd fetch from an RPC or admin endpoint, since sellers can't list users.
      // We will assume the manager has permissions to view user_profiles
      const { data } = await supabase.from('user_profiles').select('id, nickname, role, branch_id').eq('branch_id', branchId);
      if (data) setUsers(data);
      setLoading(false);
    }
    fetchBranchUsers();
  }, [branchId, supabase]);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Assigned Staff</h2>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : (
        <div className="space-y-4">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 uppercase">
                  {u.nickname?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{u.nickname || 'Unnamed Seller'}</div>
                  <div className="text-xs font-medium text-slate-500 uppercase">{u.role}</div>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="text-slate-500">No staff assigned to this branch.</p>}
        </div>
      )}
    </div>
  );
}

// ─── STOCK TAKE TAB ───────────────────────────────────────────────────────────
function StockTakeTab({ branchId }: { branchId: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Initiate Stock Take</h2>
      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-500">
        <ClipboardList size={32} className="mx-auto mb-3 text-slate-300" />
        <p className="mb-4">Begin a physical count of all items in this branch.</p>
        <button className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg">Start Stock Take</button>
      </div>
    </div>
  );
}
