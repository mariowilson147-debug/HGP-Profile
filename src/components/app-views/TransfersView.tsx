"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getProducts, type Product } from "@/lib/actions";
import { Loader2, ArrowRightLeft, History, List, Plus, Search, CheckCircle2, Package, Building2, ChevronDown, ChevronUp, Folder, FolderOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import DatePicker from "@/components/ui/DatePicker";
import SelectDropdown from "@/components/ui/SelectDropdown";

type TabType = "create" | "summary" | "items";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransferRecord = any; // You can refine this later if needed

type TransferDay = {
  dateStr: string;
  isToday: boolean;
  transfers: TransferRecord[];
  totalTransfers: number;
};

export default function TransfersView({ branchId, returnPath = "/manager" }: { branchId?: string | null, returnPath?: string }) {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();
  
  // For admin mode
  const [adminBranchId, setAdminBranchId] = useState<string>("");
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  
  const selectedBranchId = branchId || adminBranchId;
  const branchName = branches.find(b => b.id === selectedBranchId)?.name || "Selected Branch";
  const [activeTab, setActiveTab] = useState<TabType>("create");

  useEffect(() => {
    supabase.from('branches').select('id, name').then(({data}) => {
      if (data) {
        setBranches(data);
        if (!branchId && data.length > 0) setAdminBranchId(data[0].id);
      }
    });
  }, [branchId, supabase]);

  if (!selectedBranchId && branchId !== undefined && branchId !== null) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-apex-text mb-2">No Branch Selected</h2>
        <p className="text-apex-on-surface-variant">Please select a branch from the dashboard first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href={returnPath} className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-display font-bold text-apex-text">Stock Transfers</h1>
          </Link>
          <p className="text-apex-on-surface-variant mt-2">Manage stock moving in and out of <span className="font-semibold">{branchName}</span>.</p>
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

      <div className="flex gap-2 border-b border-apex-outline pb-px">
        {[
          { id: "create", label: "Create Transfer", icon: ArrowRightLeft },
          { id: "summary", label: "Transfer Summary", icon: History },
          { id: "items", label: "Item Transfers", icon: List },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-slate-900 text-slate-900  ' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300   '
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-apex-surface rounded-2xl border border-apex-outline shadow-sm p-6 min-h-[500px]">
        {activeTab === "create" && <CreateTransferTab branchId={selectedBranchId} userId={user?.id} />}
        {activeTab === "summary" && <SummaryHistoryTab branchId={selectedBranchId} />}
        {activeTab === "items" && <ItemHistoryTab branchId={selectedBranchId} />}
      </div>
    </div>
  );
}

// ─── Create Transfer Tab ──────────────────────────────────────────────────────
type TransferProduct = Product & { stock_level: number };

type CartItem = {
  product: TransferProduct;
  quantity: number;
};

function CreateTransferTab({ branchId, userId }: { branchId: string; userId?: string }) {
  const [products, setProducts] = useState<TransferProduct[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sourceBranch, setSourceBranch] = useState(branchId || "");
  const [destinationBranch, setDestinationBranch] = useState("");
  const [allBranches, setAllBranches] = useState<{ id: string, name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const supabase = createSupabaseBrowserClient();

  const { user } = useAuth();

  useEffect(() => {
    if (!sourceBranch) return;
    
    supabase.from('inventory').select('product_id, stock_level').eq('branch_id', sourceBranch).gt('stock_level', 0).then(async ({ data, error }) => {
      if (error) console.error("Error fetching transfer inventory:", error);
      if (data) {
        const allProducts = await getProducts();
        const invMap = new Map(data.map(i => [i.product_id, i.stock_level]));
        const mapped = allProducts
          .filter(p => invMap.has(p.id))
          .map(p => ({
            ...p,
            stock_level: invMap.get(p.id)!
          })) as TransferProduct[];
        setProducts(mapped);
      }
    });
    supabase.from('branches').select('id, name').then(({ data }) => {
      if (data) {
        if (user?.role === 'manager') {
          const allowed = user.assigned_branches || (user.branch_id ? [user.branch_id] : []);
          setAllBranches(data.filter(b => allowed.includes(b.id)));
        } else {
          setAllBranches(data);
        }
      }
    });
  }, [sourceBranch, supabase, user]);

  const allFiltered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(allFiltered.length / itemsPerPage);
  const filtered = allFiltered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const addToCart = (product: TransferProduct) => {
    if (cart.find(c => c.product.id === product.id)) return;
    setCart([...cart, { product, quantity: 1 }]);
    setSearch("");
  };

  const updateCart = (index: number, quantity: string) => {
    const newCart = [...cart];
    let qty = parseInt(quantity) || 0;
    if (qty > newCart[index].product.stock_level) {
      qty = newCart[index].product.stock_level;
    }
    newCart[index].quantity = qty;
    setCart(newCart);
  };

  const removeCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleSubmit = async () => {
    if (cart.length === 0 || !userId || !sourceBranch || !destinationBranch) return;
    if (sourceBranch === destinationBranch) {
      alert("Source and destination branches cannot be the same.");
      return;
    }
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      // 1. Check current inventory to ensure sufficient stock
      for (const item of cart) {
        const { data: invData } = await supabase.from('inventory').select('stock_level').eq('branch_id', sourceBranch).eq('product_id', item.product.id).single();
        if (!invData || invData.stock_level < item.quantity) {
          throw new Error(`Insufficient stock for ${item.product.name}. Available: ${invData?.stock_level || 0}`);
        }
      }

      // 2. Create Transfer Header
      const { data: transfer, error: tError } = await supabase.from('transfers').insert([{
        from_branch_id: sourceBranch,
        to_branch_id: destinationBranch,
        status: 'pending',
        created_by: userId
      }]).select().single();

      if (tError || !transfer) throw tError || new Error("Failed to create transfer record");

      // 3. Create Transfer Items & Deduct Inventory (Destination inventory increases when they accept)
      const itemInserts = [];
      for (const item of cart) {
        itemInserts.push({
          transfer_id: transfer.id,
          product_id: item.product.id,
          quantity: item.quantity
        });

        // Deduct from Source Inventory immediately
        const { data: invData } = await supabase.from('inventory').select('id, stock_level').eq('branch_id', sourceBranch).eq('product_id', item.product.id).single();
        if (invData) {
          await supabase.from('inventory').update({ stock_level: invData.stock_level - item.quantity }).eq('id', invData.id);
        }
      }

      await supabase.from('transfer_items').insert(itemInserts);

      setSuccessMsg("Transfer successfully initiated. Waiting for destination branch to accept.");
      setCart([]);
      setDestinationBranch("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: unknown) {
      console.error(err);
      alert((err as Error).message || "Failed to process transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="font-bold text-apex-text mb-4">Select Items to Transfer</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant" size={18} />
          <input 
            type="text" 
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-apex-surface-highest border border-apex-outline rounded-xl focus:ring-2 focus:ring-apex-text outline-none"
          />
        </div>
        
        <div className="border border-apex-outline rounded-xl overflow-hidden divide-y divide-apex-outline-variant">
          {filtered.map(p => (
            <button 
              key={p.id}
              onClick={() => addToCart(p)}
              className="w-full flex items-center justify-between p-4 hover:bg-apex-surface-low transition-colors text-left"
            >
              <div>
                <div className="font-bold text-apex-text">{p.name}</div>
                <div className="text-sm text-apex-on-surface-variant">SKU: {p.sku || 'N/A'} • Available: <span className="font-bold text-slate-800">{p.stock_level}</span></div>
              </div>
              <Plus className="text-apex-on-surface-variant" size={20} />
            </button>
          ))}
          {filtered.length === 0 && <div className="p-4 text-center text-apex-on-surface-variant">No products found.</div>}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-sm text-slate-500">
              {((page - 1) * itemsPerPage) + 1}-{Math.min(page * itemsPerPage, allFiltered.length)} of {allFiltered.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold text-apex-text mb-4">Transfer Details</h2>
        {successMsg && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 size={20} />
            {successMsg}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-apex-text mb-2">Transfer From</label>
            <SelectDropdown
              value={sourceBranch}
              onChange={(val) => {
                setSourceBranch(val);
                setCart([]); // Clear cart when source changes
              }}
              options={allBranches.map(b => ({ label: b.name, value: b.id }))}
              placeholder="-- Select Source --"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-apex-text mb-2">Transfer To</label>
            <SelectDropdown
              value={destinationBranch}
              onChange={setDestinationBranch}
              options={allBranches.map(b => ({ label: b.name, value: b.id }))}
              placeholder="-- Select Destination --"
            />
          </div>
        </div>
        
        {cart.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-apex-outline rounded-xl text-center text-apex-on-surface-variant">
            <Package className="mx-auto mb-2 text-slate-300" size={32} />
            Add products to initiate a transfer
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item, idx) => (
              <div key={item.product.id} className="p-4 border border-apex-outline rounded-xl bg-apex-surface-highest">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-bold text-apex-text">{item.product.name}</div>
                  <button onClick={() => removeCart(idx)} className="text-red-500 text-sm font-medium hover:underline">Remove</button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-apex-on-surface-variant mb-1">Quantity to Transfer (Max {item.product.stock_level})</label>
                  <input 
                    type="number" min="1" max={item.product.stock_level} value={item.quantity} 
                    onChange={e => updateCart(idx, e.target.value)}
                    className="w-full p-2 border border-apex-outline rounded-lg outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            ))}

            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !sourceBranch || !destinationBranch || sourceBranch === destinationBranch}
              className="w-full py-3 hover:bg-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 bg-apex-surface-highest text-apex-text"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ArrowRightLeft size={18} />}
              Initiate Transfer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Summary History Tab ──────────────────────────────────────────────────────
function SummaryHistoryTab({ branchId }: { branchId: string }) {
  const [history, setHistory] = useState<TransferDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const channel = supabase.channel('transfers_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transfers' }, () => {
        setRefreshTrigger(prev => prev + 1);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    async function fetchTransfers() {
      setLoading(true);
      const start = new Date(fromDate); start.setHours(0,0,0,0);
      const end = new Date(toDate); end.setHours(23,59,59,999);

      const { data } = await supabase
        .from('transfers')
        .select(`
          id, created_at, status, from_branch_id, to_branch_id,
          user_profiles!transfers_created_by_fkey ( nickname ),
          from_branch:branches!transfers_from_branch_id_fkey ( name ),
          to_branch:branches!transfers_to_branch_id_fkey ( name ),
          transfer_items ( id, quantity, products ( name, sku ) )
        `)
        .or(`from_branch_id.eq.${branchId},to_branch_id.eq.${branchId}`)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });
      
      if (mounted && data) {
        const grouped: Record<string, TransferDay> = {};
        const todayStr = new Date().toLocaleDateString();

        data.forEach(t => {
          const dateStr = new Date(t.created_at).toLocaleDateString();
          if (!grouped[dateStr]) {
            grouped[dateStr] = {
              dateStr,
              isToday: dateStr === todayStr,
              transfers: [],
              totalTransfers: 0
            };
          }
          grouped[dateStr].transfers.push(t);
          grouped[dateStr].totalTransfers += 1;
        });

        const historyArray = Object.values(grouped).sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
        setHistory(historyArray);
      }
      if (mounted) setLoading(false);
    }
    fetchTransfers();
    return () => { mounted = false; }
  }, [branchId, fromDate, toDate, supabase, refreshTrigger]);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-apex-on-surface-variant" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 bg-apex-surface p-2 rounded-2xl shadow-sm border border-apex-outline w-fit">
        <DatePicker date={fromDate} setDate={setFromDate} label="From Date" />
        <DatePicker date={toDate} setDate={setToDate} label="To Date" />
      </div>

      {!selectedDate ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map(day => (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              className="bg-apex-surface p-5 rounded-2xl border border-apex-outline shadow-sm hover:shadow-md transition-all text-left group flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${day.isToday ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                  {day.isToday ? <FolderOpen size={24} /> : <Folder size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-apex-text">{day.dateStr}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${day.isToday ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {day.totalTransfers} items
                  </span>
                </div>
              </div>
            </button>
          ))}
          {history.length === 0 && (
            <div className="col-span-full py-12 text-center text-apex-on-surface-variant bg-apex-surface rounded-2xl border border-apex-outline border-dashed">
              No transfers found for the selected period.
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto border border-apex-outline rounded-xl bg-apex-surface">
          <div className="p-4 border-b border-apex-outline flex items-center gap-4 bg-apex-surface-highest">
            <button 
              onClick={() => setSelectedDate(null)}
              className="p-2 hover:bg-apex-surface-low rounded-xl transition-colors text-apex-on-surface-variant"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="font-bold text-apex-text text-lg">Transfers on {selectedDate}</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-apex-surface-highest text-apex-on-surface-variant border-b border-apex-outline">
              <tr>
                <th className="p-4 font-medium">Time</th>
                <th className="p-4 font-medium">Transfer ID</th>
                <th className="p-4 font-medium">Direction</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apex-outline-variant">
              {history.find(h => h.dateStr === selectedDate)?.transfers.map(t => {
                const isOutgoing = t.from_branch_id === branchId;
                const isExpanded = expandedId === t.id;
                return (
                  <React.Fragment key={t.id}>
                    <tr onClick={() => setExpandedId(isExpanded ? null : t.id)} className="hover:bg-apex-surface-low cursor-pointer">
                      <td className="p-4 text-apex-on-surface-variant">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-apex-on-surface-variant">{t.id.split('-')[0]}</td>
                      <td className="p-4 font-medium text-apex-text">
                        {isOutgoing ? (
                          <span className="text-blue-600">To: {t.to_branch?.name}</span>
                        ) : (
                          <span className="text-emerald-600">From: {t.from_branch?.name}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          t.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          t.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && t.transfer_items && t.transfer_items.length > 0 && (
                      <tr className="bg-apex-surface-highest border-t border-apex-outline-variant">
                        <td colSpan={4} className="p-4">
                          <div className="bg-apex-surface border border-apex-outline rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-apex-surface-highest text-apex-on-surface-variant border-b border-apex-outline">
                                <tr>
                                  <th className="p-3 font-medium">Product</th>
                                  <th className="p-3 font-medium text-right">Qty</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-apex-outline-variant">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {t.transfer_items.map((item: any) => (
                                  <tr key={item.id}>
                                    <td className="p-3">
                                      <div className="font-bold text-apex-text">{item.products?.name}</div>
                                      <div className="text-apex-on-surface-variant">{item.products?.sku}</div>
                                    </td>
                                    <td className="p-3 text-right font-medium">{item.quantity}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {history.find(h => h.dateStr === selectedDate)?.transfers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-apex-on-surface-variant">No transfers found for this date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
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

      // Get all transfer items where the transfer involves the selected branch
      const { data } = await supabase
        .from('transfer_items')
        .select(`
          id, quantity, product_id,
          products ( name, sku ),
          transfers!inner ( id, created_at, status, from_branch_id, to_branch_id )
        `)
        .or(`from_branch_id.eq.${branchId},to_branch_id.eq.${branchId}`, { referencedTable: 'transfers' })
        .gte('transfers.created_at', start.toISOString())
        .lte('transfers.created_at', end.toISOString())
        .order('transfers(created_at)', { ascending: false });
      
      if (data) setItems(data);
      setLoading(false);
    }
    fetchItems();
  }, [branchId, fromDate, toDate, supabase]);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-apex-on-surface-variant" /></div>;

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
        <div className="flex flex-col sm:flex-row gap-4 bg-apex-surface p-2 rounded-2xl shadow-sm border border-apex-outline w-fit">
          <DatePicker date={fromDate} setDate={setFromDate} label="From Date" />
          <DatePicker date={toDate} setDate={setToDate} label="To Date" />
        </div>
        <div className="relative w-full sm:w-64 self-end sm:self-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-apex-on-surface-variant" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-[#2ab6eb] outline-none text-sm transition-all shadow-sm h-[60px] text-apex-text"
          />
        </div>
      </div>
      <div className="overflow-x-auto border border-apex-outline rounded-xl">
      <table className="w-full text-left text-sm">
        <thead className="bg-apex-surface-highest text-apex-on-surface-variant border-b border-apex-outline">
          <tr>
            <th className="p-4 font-medium">Date</th>
            <th className="p-4 font-medium">Product</th>
            <th className="p-4 font-medium">Transfer Type</th>
            <th className="p-4 font-medium">Qty</th>
            <th className="p-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-apex-outline-variant">
          {filteredItems.map(item => {
            const t = item.transfers;
            const isOutgoing = t.from_branch_id === branchId;
            return (
              <tr key={item.id} className="hover:bg-apex-surface-low">
                <td className="p-4 text-apex-on-surface-variant">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="font-bold text-apex-text">{item.products?.name}</div>
                  <div className="text-xs text-apex-on-surface-variant">{item.products?.sku}</div>
                </td>
                <td className="p-4 font-medium">
                  {isOutgoing ? (
                    <span className="text-blue-600">Outgoing</span>
                  ) : (
                    <span className="text-emerald-600">Incoming</span>
                  )}
                </td>
                <td className="p-4 text-apex-on-surface-variant font-bold">{item.quantity}</td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    t.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    t.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            );
          })}
          {filteredItems.length === 0 && (
            <tr><td colSpan={5} className="p-8 text-center text-apex-on-surface-variant">No item history found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}
