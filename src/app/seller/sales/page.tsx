"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2, Receipt, Search, Calendar, ChevronDown } from "lucide-react";
import Link from "next/link";

type SaleRecord = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_profiles: { nickname: string | null } | { nickname: string | null }[] | null;
  sale_items: {
    quantity: number;
    subtotal: number;
    products: { name: string; category: string } | { name: string; category: string }[] | null;
  }[];
};

function getProfile(p: SaleRecord['user_profiles']): { nickname: string | null } | null {
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

function getProduct(p: { name: string; category: string } | { name: string; category: string }[] | null): { name: string; category: string } | null {
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export default function SellerSalesHistory() {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchSales() {
      if (!user?.branch_id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          user_profiles(nickname),
          sale_items(
            quantity,
            subtotal,
            products(name, category)
          )
        `)
        .eq('branch_id', user.branch_id)
        .order('created_at', { ascending: false });

      if (mounted && data) {
        setSales(data as unknown as SaleRecord[]);
        setLoading(false);
      }
    }

    fetchSales();
    return () => { mounted = false; };
  }, [user, supabase]);

  const filtered = sales.filter(s => 
    s.id.toLowerCase().includes(search.toLowerCase()) || 
    (getProfile(s.user_profiles)?.nickname?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href="/seller" className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-display font-bold text-slate-900">Sales History</h1>
          </Link>
          <p className="text-slate-500 mt-2">View past transactions and receipts for this branch.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by receipt ID or seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-slate-400 mb-4" size={32} />
          <p className="text-slate-500 text-sm animate-pulse">Loading sales history...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(sale => {
            const date = new Date(sale.created_at);
            const isExpanded = expandedId === sale.id;

            return (
              <div 
                key={sale.id} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Sale Header (Click to expand) */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : sale.id)}
                  className="p-5 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${sale.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Receipt size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 font-mono text-sm uppercase tracking-wider">
                        #{sale.id.split('-')[0]}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <Calendar size={12} />
                        {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded ml-2">
                          {getProfile(sale.user_profiles)?.nickname || "Unknown Seller"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 ml-auto md:ml-0 w-full md:w-auto justify-end">
                    <div className="text-right">
                      <div className="text-xl font-display font-bold text-slate-900 tracking-tight">
                        KES {sale.total_amount.toLocaleString()}
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${sale.status === 'completed' ? 'text-green-600' : 'text-slate-500'}`}>
                        {sale.status}
                      </div>
                    </div>
                    <ChevronDown size={20} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-100 p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Receipt Items</h4>
                    <div className="space-y-3">
                      {sale.sale_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {getProduct(item.products)?.name || "Deleted Product"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Qty: {item.quantity} x KES {(item.subtotal / item.quantity).toLocaleString()}
                            </p>
                          </div>
                          <span className="font-bold text-slate-900 text-sm">
                            KES {item.subtotal.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Receipt className="mx-auto text-slate-300 mb-3" size={32} />
              <h3 className="text-lg font-medium text-slate-900">No sales found</h3>
              <p className="text-slate-500 mt-1">There are no transactions matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
