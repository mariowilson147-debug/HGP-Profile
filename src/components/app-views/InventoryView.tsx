"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Search, Loader2, AlertTriangle, PackageOpen, TrendingUp, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/actions";

type InventoryItem = {
  id: string;
  stock_level: number;
  reorder_level: number;
  branch_buying_price?: number | null;
  branch_wholesale_price?: number | null;
  branch_retail_price?: number | null;
  products: {
    id: string;
    name: string;
    sku: string;
    category: string;
    image_url: string;
    wholesale_price: number;
    retail_price: number;
    buying_price: number;
  };
  branches?: {
    name: string;
  };
};

export default function InventoryView({ branchId, returnPath, showValuation = false }: { branchId?: string | null; returnPath: string; showValuation?: boolean }) {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const [selectedViewBranch, setSelectedViewBranch] = useState<string | null>(branchId || null);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    async function fetchBranches() {
      let q = supabase.from('branches').select('id, name').order('name');
      if (user?.role === 'manager' && user.assigned_branches && user.assigned_branches.length > 0) {
        q = q.in('id', user.assigned_branches);
      }
      const { data } = await q;
      if (data) setBranches(data);
    }
    fetchBranches();
  }, [supabase, user]);

  useEffect(() => {
    let mounted = true;
    async function loadInventory() {
      setLoading(true);
      // Fetch all products using the server action to bypass RLS issues
      const allProducts = await getProducts();

      // Fetch inventory (include WAC branch_buying_price for valuation)
      let invQuery = supabase
        .from('inventory')
        .select('id, stock_level, reorder_level, product_id, branch_id, branch_buying_price, branch_wholesale_price, branch_retail_price, branches(name)');

      if (selectedViewBranch) {
        invQuery = invQuery.eq('branch_id', selectedViewBranch);
      }

      const { data: inventoryData, error: invError } = await invQuery;
      
      if (invError) {
        console.error("Inventory fetch error:", invError);
      }

      if (mounted) {
        if (allProducts) {
          if (selectedViewBranch) {
            // Manager mode: show 1 row per product for this branch
            const invMap = new Map((inventoryData || []).map((inv: Record<string, unknown>) => [inv.product_id as string, inv]));
            const merged = allProducts
              .filter((p: Record<string, unknown>) => {
                const inv = invMap.get(p.id as string);
                return inv && (inv.stock_level as number) > 0;
              })
              .map((p: Record<string, unknown>) => {
                const inv = invMap.get(p.id as string)!;
                return {
                  id: inv.id as string,
                  product_id: p.id as string,
                  stock_level: inv.stock_level as number,
                  reorder_level: (inv.reorder_level as number) || 10,
                  branch_buying_price: inv.branch_buying_price as number | null,
                  branch_wholesale_price: inv.branch_wholesale_price as number | null,
                  branch_retail_price: inv.branch_retail_price as number | null,
                  products: p,
                  branches: null
                };
            });
            setInventory(merged as unknown as InventoryItem[]);
          } else {
            // Admin mode: one row per inventory line so valuation can use per-branch WAC
            const productMap = new Map(allProducts.map((p: Record<string, unknown>) => [p.id as string, p]));
            const merged = (inventoryData || [])
              .filter((inv: Record<string, unknown>) => ((inv.stock_level as number) || 0) > 0)
              .map((inv: Record<string, unknown>) => {
                const p = productMap.get(inv.product_id as string);
                return {
                  id: inv.id as string,
                  product_id: inv.product_id as string,
                  stock_level: (inv.stock_level as number) || 0,
                  reorder_level: (inv.reorder_level as number) || 10,
                  branch_buying_price: inv.branch_buying_price as number | null,
                  branch_wholesale_price: inv.branch_wholesale_price as number | null,
                  branch_retail_price: inv.branch_retail_price as number | null,
                  products: p || {
                    id: inv.product_id,
                    name: 'Unknown',
                    sku: '',
                    category: '',
                    image_url: '',
                    wholesale_price: 0,
                    retail_price: 0,
                    buying_price: 0,
                  },
                  branches: inv.branches as { name: string } | null
                };
              })
              .filter((row: { products: unknown }) => row.products);
            setInventory(merged as unknown as InventoryItem[]);
          }
        }
        setLoading(false);
      }
    }

    loadInventory();
    return () => { mounted = false };
  }, [selectedViewBranch, supabase]);

  const filtered = inventory.filter(item => 
    item.stock_level > 0 &&
    (item.products?.name?.toLowerCase().includes(search.toLowerCase()) || 
    item.products?.category?.toLowerCase().includes(search.toLowerCase()) ||
    (item.products?.sku && item.products?.sku.toLowerCase().includes(search.toLowerCase())))
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const unitCost = (item: InventoryItem) =>
    item.branch_buying_price ?? item.products?.buying_price ?? 0;

  const totalValuation = inventory.reduce(
    (sum, item) => sum + (item.stock_level * unitCost(item)),
    0
  );

  const exportToExcel = () => {
    const headers = ["Name", "SKU", "Category", "Avg Cost (WAC)", "Wholesale Price", "Retail Price", "Stock Level", "Reorder Level", "Branch"];
    
    const rows = filtered.map(p => [
      `"${(p.products?.name || '').replace(/"/g, '""')}"`,
      `"${p.products?.sku || ''}"`,
      `"${p.products?.category || ''}"`,
      unitCost(p),
      p.branch_wholesale_price ?? p.products?.wholesale_price ?? 0,
      p.branch_retail_price ?? p.products?.retail_price ?? 0,
      p.stock_level || 0,
      p.reorder_level || 0,
      `"${p.branches?.name || ''}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Inventory_Export_${selectedViewBranch ? 'Branch' : 'Universal'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href={returnPath} className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-display font-bold text-apex-text">
              {selectedViewBranch ? "Branch Inventory" : "Universal Inventory"}
            </h1>
          </Link>
          <p className="text-apex-on-surface-variant mt-2">
            {selectedViewBranch ? "Manage stock levels for your specific location." : "Global view of stock across all branches."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {user?.role !== 'seller' && (
            <div className="relative w-full sm:w-64">
              <select
                value={selectedViewBranch || ""}
                onChange={(e) => {
                  setSelectedViewBranch(e.target.value || null);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-apex-text focus:border-transparent outline-none transition-all shadow-sm text-apex-text appearance-none"
              >
                <option value="">Universal (All Branches)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          )}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant" size={18} />
            <input 
              type="text" 
              placeholder="Search branch stock..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-apex-text focus:border-transparent outline-none transition-all shadow-sm text-apex-text"
            />
          </div>
          <button 
            onClick={exportToExcel}
            className="flex justify-center items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto shadow-sm whitespace-nowrap"
            title="Export as Excel (CSV)"
          >
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {showValuation && !loading && (
        <div className="p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between shadow-sm bg-apex-surface-highest text-apex-text">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <TrendingUp className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="text-slate-300 text-sm font-medium">Total Goods Valuation (WAC)</h3>
              <p className="text-3xl font-display font-bold">KES {totalValuation.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-apex-on-surface-variant text-sm text-right hidden md:block">
            Based on stock × weighted average cost per branch.<br/>
            Total Line Items: {inventory.length}
          </div>
        </div>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-apex-on-surface-variant mb-4" size={32} />
          <p className="text-apex-on-surface-variant text-sm animate-pulse">Loading branch inventory...</p>
        </div>
      ) : (
        <div className="bg-apex-surface border border-apex-outline rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-apex-surface-highest border-b border-apex-outline text-xs uppercase tracking-wider text-apex-on-surface-variant font-semibold">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  {!selectedViewBranch && <th className="px-6 py-4">Branch</th>}
                  <th className="px-6 py-4">Stock Level</th>
                  <th className="px-6 py-4">Avg Cost</th>
                  <th className="px-6 py-4">Wholesale Price</th>
                  <th className="px-6 py-4">Retail Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apex-outline-variant text-sm">
                {paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-apex-surface-lowest border border-apex-outline overflow-hidden relative flex items-center justify-center">
                        {item.products.image_url ? (
                          <Image src={item.products.image_url} alt={item.products.name} fill className="object-cover" />
                        ) : (
                          <PackageOpen size={16} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-apex-text">{item.products.name}</div>
                        <div className="text-xs text-apex-on-surface-variant">{item.products.sku || "N/A"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-apex-surface-lowest text-apex-on-surface-variant border border-apex-outline">
                        {item.products.category}
                      </span>
                    </td>
                    {!selectedViewBranch && (
                      <td className="px-6 py-4">
                        <span className="text-apex-on-surface-variant font-medium text-sm">
                          {item.branches?.name || "Unknown Branch"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className={`font-bold ${item.stock_level <= item.reorder_level ? 'text-red-600' : 'text-slate-900'}`}>
                        {item.stock_level}
                      </div>
                      {item.stock_level <= item.reorder_level && (
                        <div className="text-[10px] text-red-500 font-medium">Low Stock</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-apex-text">
                      KES {unitCost(item).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-apex-text">
                      KES {(item.branch_wholesale_price ?? item.products.wholesale_price)?.toLocaleString() || "0"}
                    </td>
                    <td className="px-6 py-4 text-apex-on-surface-variant">
                      KES {(item.branch_retail_price ?? item.products.retail_price)?.toLocaleString() || "0"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={selectedViewBranch ? 6 : 7} className="px-6 py-12 text-center text-apex-on-surface-variant">
                      No inventory items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-4 border-t border-apex-outline-variant bg-apex-surface-highest flex items-center justify-between text-sm">
              <span className="text-apex-on-surface-variant">
                Showing <span className="font-medium text-apex-text">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-apex-text">{Math.min(page * itemsPerPage, filtered.length)}</span> of <span className="font-medium text-apex-text">{filtered.length}</span> items
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-apex-outline bg-apex-surface hover:bg-apex-surface-low disabled:opacity-50 flex items-center gap-1 font-medium transition-colors"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-apex-outline bg-apex-surface hover:bg-apex-surface-low disabled:opacity-50 flex items-center gap-1 font-medium transition-colors"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
