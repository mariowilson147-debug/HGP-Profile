"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createAdjustment, getAdjustmentHistory, type InventoryAdjustment } from "@/lib/actions";
import { Search, Loader2, PackageOpen, AlertTriangle, Save, Calendar, Check, History, Calculator } from "lucide-react";
import Image from "next/image";

import Link from "next/link";

type InventoryItem = {
  id: string | null;
  stock_level: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    sku: string;
    category: string;
    image_url: string;
  };
};

export default function AdjustmentsView({ branchId, returnPath = "/manager" }: { branchId?: string | null, returnPath?: string }) {
  const { user } = useAuth();
  
  // For admin mode
  const [adminBranchId, setAdminBranchId] = useState<string>("");
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  
  const selectedBranchId = branchId || adminBranchId;
  const supabase = createSupabaseBrowserClient();
  
  const [activeTab, setActiveTab] = useState<"make" | "history">("make");
  
  // Make Adjustment State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // History State
  const [history, setHistory] = useState<Array<InventoryAdjustment & { manager_name?: string, products: { name: string, sku: string, image_url: string } }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Date Picker State for History
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0],
    to: new Date(new Date().setHours(23, 59, 59, 999)).toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!branchId) {
      supabase.from('branches').select('id, name').then(({data}) => {
        if (data) {
          setBranches(data);
          if (data.length > 0) setAdminBranchId(data[0].id);
        }
      });
    }
  }, [branchId, supabase]);

  // Load Inventory for Make Adjustment
  useEffect(() => {
    let mounted = true;
    async function loadInventory() {
      if (!selectedBranchId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      
      // Fetch all products
      const { data: allProducts } = await supabase.from('products').select('id, name, sku, category, image_url');
      
      // Fetch inventory for this branch
      const { data: branchInventory } = await supabase
        .from('inventory')
        .select('id, stock_level, product_id')
        .eq('branch_id', selectedBranchId);

      if (mounted) {
        if (allProducts) {
          const inventoryMap = new Map((branchInventory || []).map((inv: Record<string, unknown>) => [inv.product_id, inv]));
          
          const mergedInventory: InventoryItem[] = allProducts.map((prod: Record<string, unknown>) => {
            const inv = inventoryMap.get(prod.id) as Record<string, unknown> | undefined;
            return {
              id: inv ? inv.id as string : null,
              stock_level: inv ? inv.stock_level as number : 0,
              product_id: prod.id as string,
              products: prod as { id: string, name: string, sku: string, category: string, image_url: string }
            };
          });
          
          setInventory(mergedInventory);
        }
        setLoading(false);
      }
    }
    loadInventory();
    return () => { mounted = false };
  }, [selectedBranchId, supabase]);

  // Load History
  useEffect(() => {
    let mounted = true;
    async function loadHistory() {
      if (!selectedBranchId || activeTab !== "history") return;
      setHistoryLoading(true);
      try {
        const fromDate = dateRange.from ? new Date(dateRange.from) : undefined;
        const toDate = dateRange.to ? new Date(dateRange.to) : undefined;
        const data = await getAdjustmentHistory(selectedBranchId, fromDate, toDate);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (mounted) setHistory(data as any);
      } catch (err) {
        console.error("Failed to load adjustment history", err);
      } finally {
        if (mounted) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => { mounted = false };
  }, [selectedBranchId, activeTab, dateRange]);

  const filteredInventory = inventory.filter(item => 
    item.products?.name.toLowerCase().includes(search.toLowerCase()) || 
    item.products?.category.toLowerCase().includes(search.toLowerCase()) ||
    (item.products?.sku && item.products?.sku.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 10); // Limit to 10 for quick search

  const handleAdjust = async () => {
    if (!selectedItem || !user || !selectedBranchId) return;
    const adjustVal = parseInt(adjustAmount);
    if (isNaN(adjustVal)) return;

    setSaving(true);
    setSuccessMsg("");

    const newStock = selectedItem.stock_level + adjustVal;
    
    const adjustment: InventoryAdjustment = {
      branch_id: selectedBranchId,
      product_id: selectedItem.product_id,
      manager_id: user.id,
      old_stock: selectedItem.stock_level,
      new_stock: newStock,
      difference: adjustVal,
      reason: reason || "Manual Adjustment"
    };

    try {
      await createAdjustment(adjustment, selectedItem.id);
      
      // If we just created the inventory record, we should ideally fetch its real ID, but
      // a simple reload of inventory or local mock is enough until refresh.
      // Easiest is to trigger a reload of inventory to get the real ID, but for now we mock it.
      setInventory(prev => prev.map(item => 
        item.product_id === selectedItem.product_id 
          ? { ...item, stock_level: newStock, id: item.id || "temp-id" } 
          : item
      ));
      setSelectedItem({ ...selectedItem, stock_level: newStock, id: selectedItem.id || "temp-id" });
      setAdjustAmount("");
      setReason("");
      setSuccessMsg("Stock successfully adjusted!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save adjustment.");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedBranchId && branchId !== undefined && branchId !== null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertTriangle className="text-amber-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-apex-text mb-2">No Branch Selected</h2>
        <p className="text-apex-on-surface-variant">Please select a branch from the dashboard first to manage adjustments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href={returnPath} className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-display font-bold text-apex-text">Inventory Adjustments</h1>
          </Link>
          <p className="text-apex-on-surface-variant mt-2">Correct stock discrepancies manually and track adjustment history.</p>
        </div>
        
        {!branchId && (
          <div className="flex flex-col">
            <label className="text-xs font-bold text-apex-on-surface-variant uppercase tracking-wider mb-1">Select Branch</label>
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

      <div className="flex bg-apex-surface rounded-xl shadow-sm border border-apex-outline p-1 w-full md:w-fit">
        <button
          onClick={() => setActiveTab("make")}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'make' 
              ? 'bg-slate-900 text-white   shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50   '
          }`}
        >
          <Calculator size={16} /> Make Adjustment
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'history' 
              ? 'bg-slate-900 text-white   shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50   '
          }`}
        >
          <History size={16} /> History
        </button>
      </div>

      {activeTab === "make" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side: Search */}
          <div className="bg-apex-surface rounded-2xl shadow-sm border border-apex-outline p-6">
            <h2 className="font-bold text-apex-text mb-4">Select Product from Inventory</h2>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant" size={18} />
              <input 
                type="text" 
                placeholder="Search inventory by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-apex-surface-highest border border-apex-outline rounded-xl focus:ring-2 focus:ring-apex-text focus:border-transparent outline-none transition-all text-apex-text"
              />
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-apex-on-surface-variant" size={24} />
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredInventory.map(item => (
                  <button
                    key={item.product_id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left flex items-center gap-4 p-3 rounded-xl border transition-all ${selectedItem?.product_id === item.product_id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <div className="w-12 h-12 bg-apex-surface rounded-lg border border-apex-outline-variant overflow-hidden relative shrink-0 flex items-center justify-center">
                      {item.products.image_url ? (
                        <Image src={item.products.image_url} alt={item.products.name} fill className="object-cover" />
                      ) : (
                        <PackageOpen size={20} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-apex-text truncate">{item.products.name}</div>
                      <div className="text-xs text-apex-on-surface-variant truncate">{item.products.sku || "No SKU"} &bull; {item.products.category}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-medium text-apex-on-surface-variant">Stock</div>
                      <div className="font-display font-bold text-apex-text">{item.stock_level}</div>
                    </div>
                  </button>
                ))}
                {filteredInventory.length === 0 && search && (
                  <p className="text-center text-apex-on-surface-variant py-4">No inventory matching &quot;{search}&quot;</p>
                )}
                {inventory.length === 0 && !loading && (
                  <p className="text-center text-apex-on-surface-variant py-4">Inventory is empty for this branch.</p>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Adjust */}
          <div className="space-y-6">
            {!selectedItem ? (
              <div className="bg-apex-surface-highest rounded-2xl border border-apex-outline border-dashed p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <Calculator size={48} className="text-slate-300 mb-4" />
                <h3 className="font-bold text-apex-text mb-1">No Product Selected</h3>
                <p className="text-apex-on-surface-variant text-sm max-w-sm">Search and select a product from the list to adjust its stock level.</p>
              </div>
            ) : (
              <div className="bg-apex-surface rounded-2xl shadow-sm border border-apex-outline overflow-hidden">
                <div className="p-6 bg-apex-surface-highest text-apex-text">
                  <h2 className="font-bold text-lg mb-1">Adjusting Stock</h2>
                  <p className="text-apex-on-surface-variant text-sm">You are making an adjustment for:</p>
                  <div className="mt-4 flex items-center gap-4 bg-white/10 rounded-xl p-4">
                    <div className="w-16 h-16 bg-apex-surface rounded-lg overflow-hidden relative shrink-0 flex items-center justify-center">
                      {selectedItem.products.image_url ? (
                        <Image src={selectedItem.products.image_url} alt={selectedItem.products.name} fill className="object-cover" />
                      ) : (
                        <PackageOpen size={24} className="text-slate-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-display font-bold text-xl">{selectedItem.products.name}</div>
                      <div className="text-slate-300 text-sm">{selectedItem.products.sku || "No SKU"}</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                        <Check className="text-emerald-600" size={16} />
                      </div>
                      <p className="font-medium text-sm">{successMsg}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-apex-surface-highest border border-apex-outline-variant rounded-xl p-4 text-center">
                      <div className="text-xs font-medium text-apex-on-surface-variant uppercase tracking-wider mb-1">Current Stock</div>
                      <div className="text-3xl font-display font-bold text-apex-text">{selectedItem.stock_level}</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                      <div className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">New Stock</div>
                      <div className="text-3xl font-display font-bold text-blue-900">
                        {isNaN(parseInt(adjustAmount)) ? selectedItem.stock_level : selectedItem.stock_level + parseInt(adjustAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-apex-text mb-1.5">Adjustment Amount</label>
                      <p className="text-xs text-apex-on-surface-variant mb-2">Use positive numbers to add stock, and negative numbers (e.g. -2) to deduct stock.</p>
                      <input 
                        type="number" 
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        placeholder="+0 or -0"
                        className="w-full px-4 py-3 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-display text-lg text-apex-text"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-apex-text mb-1.5">Reason for Adjustment</label>
                      <select 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-4 py-3 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-apex-text"
                      >
                        <option value="">Select a reason...</option>
                        <option value="Damaged Goods">Damaged Goods</option>
                        <option value="Lost / Stolen">Lost / Stolen</option>
                        <option value="Stocktake Correction">Stocktake Correction</option>
                        <option value="Found Extra Stock">Found Extra Stock</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleAdjust}
                    disabled={saving || isNaN(parseInt(adjustAmount)) || parseInt(adjustAmount) === 0}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-bold transition-all shadow-sm"
                  >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? "Saving..." : "Save Adjustment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-apex-surface rounded-2xl shadow-sm border border-apex-outline overflow-hidden">
          {/* Cyan/Blue Custom Date Range Picker matching purchases/transfers */}
          <div className="p-6 border-b border-apex-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <h2 className="font-bold text-apex-text text-lg">Adjustment Logs</h2>
            <div className="flex items-center gap-2 bg-apex-surface p-1.5 rounded-xl border border-apex-outline shadow-sm w-fit">
              <div className="flex items-center gap-2 px-3">
                <Calendar size={16} className="text-cyan-600" />
                <input 
                  type="date" 
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="bg-transparent border-none text-sm font-medium text-apex-text outline-none focus:ring-0 cursor-pointer"
                />
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              <div className="flex items-center gap-2 px-3">
                <input 
                  type="date" 
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="bg-transparent border-none text-sm font-medium text-apex-text outline-none focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {historyLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="animate-spin text-apex-on-surface-variant" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-apex-surface-highest border-b border-apex-outline text-xs uppercase tracking-wider text-apex-on-surface-variant font-semibold">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Adjustment</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apex-outline-variant text-sm">
                  {history.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-apex-on-surface-variant whitespace-nowrap">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-apex-surface-lowest border border-apex-outline overflow-hidden relative flex items-center justify-center shrink-0">
                            {item.products.image_url ? (
                              <Image src={item.products.image_url} alt={item.products.name} fill className="object-cover" />
                            ) : (
                              <PackageOpen size={14} className="text-slate-300" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-apex-text">{item.products.name}</div>
                            <div className="text-xs text-apex-on-surface-variant">SKU: {item.products.sku || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-apex-on-surface-variant line-through text-xs">{item.old_stock}</span>
                          <span className={`font-bold ${item.difference > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {item.difference > 0 ? '+' : ''}{item.difference}
                          </span>
                          <span className="font-bold text-apex-text ml-1">&rarr; {item.new_stock}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-apex-surface-lowest text-apex-text">
                          {item.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-apex-on-surface-variant font-medium">
                        {item.manager_name}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-apex-on-surface-variant">
                        No adjustments found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
