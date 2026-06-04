"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2, Folder, FolderOpen, Receipt, User, Clock, ArrowLeft, TrendingUp, Search, Calendar, List, Package } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getProducts } from "@/lib/actions";
import DatePicker from "@/components/ui/DatePicker";

type SaleItem = {
  id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  subtotal: number;
  products: {
    name: string;
    buying_price: number;
  } | null;
};

type SaleRecord = {
  id: string;
  receipt_number: string | null;
  created_at: string;
  total_amount: number;
  seller_id: string;
  sale_items: SaleItem[];
  user_profiles: { nickname: string } | null;
};

type SessionDay = {
  dateStr: string;
  isToday: boolean;
  sales: SaleRecord[];
  totalRevenue: number;
  totalMargin: number;
};

export default function SessionsView({ branchId, returnPath = "/manager" }: { branchId?: string | null, returnPath?: string }) {
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "byItem">("sessions");

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      
      let query = supabase
        .from('sales')
        .select(`
          id,
          receipt_number,
          created_at,
          total_amount,
          seller_id,
          sale_items (
            id,
            quantity,
            unit_price,
            unit_cost,
            subtotal,
            products (
              name,
              buying_price
            )
          ),
          user_profiles!seller_id (
            nickname
          )
        `)
        .order('created_at', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      } else if (user?.role === 'manager' && user.assigned_branches && user.assigned_branches.length > 0) {
        query = query.in('branch_id', user.assigned_branches);
      }

      const { data } = await query;
      
      if (data) {
        const sales = data as unknown as SaleRecord[];
        
        // Group by day
        const grouped: Record<string, SessionDay> = {};
        
        const todayStr = new Date().toLocaleDateString();

        sales.forEach(sale => {
          const dateStr = new Date(sale.created_at).toLocaleDateString();
          if (!grouped[dateStr]) {
            grouped[dateStr] = {
              dateStr,
              isToday: dateStr === todayStr,
              sales: [],
              totalRevenue: 0,
              totalMargin: 0
            };
          }
          
          grouped[dateStr].sales.push(sale);
          grouped[dateStr].totalRevenue += sale.total_amount;
          
          let saleCost = 0;
          sale.sale_items?.forEach(item => {
            const cost = item.unit_cost > 0 ? item.unit_cost : (item.products?.buying_price || 0);
            saleCost += cost * item.quantity;
          });
          grouped[dateStr].totalMargin += (sale.total_amount - saleCost);
        });

        // Convert to array and sort by date descending
        const sessionsArray = Object.values(grouped).sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
        setSessions(sessionsArray);
      }
      setLoading(false);
    }

    loadSessions();
  }, [branchId, supabase]);

  if (!branchId && branchId !== undefined && branchId !== null) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-apex-text mb-2">No Branch Selected</h2>
        <p className="text-apex-on-surface-variant">Please select a branch first.</p>
      </div>
    );
  }

  const activeSession = sessions.find(s => s.dateStr === selectedDate);

  // Group active session by seller
  const sellerData: Record<string, {
    sellerName: string;
    revenue: number;
    margin: number;
    items: {
      receipt: string;
      productName: string;
      qty: number;
      price: number;
      total: number;
      margin: number;
      time: string;
    }[];
  }> = {};

  if (activeSession) {
    activeSession.sales.forEach(sale => {
      const sellerName = sale.user_profiles?.nickname || "Unknown Seller";
      const receipt = sale.receipt_number || sale.id.split('-')[0];
      const time = new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!sellerData[sellerName]) {
        sellerData[sellerName] = { sellerName, revenue: 0, margin: 0, items: [] };
      }

      sellerData[sellerName].revenue += sale.total_amount;

      sale.sale_items?.forEach(item => {
        const cost = item.unit_cost > 0 ? item.unit_cost : (item.products?.buying_price || 0);
        const itemMargin = item.subtotal - (cost * item.quantity);
        
        sellerData[sellerName].margin += itemMargin;
        sellerData[sellerName].items.push({
          receipt,
          productName: item.products?.name || 'Unknown',
          qty: item.quantity,
          price: item.unit_price,
          total: item.subtotal,
          margin: itemMargin,
          time
        });
      });
    });
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex gap-4 border-b border-apex-outline mb-6">
        <button onClick={() => setActiveTab("sessions")} className={`px-4 py-2 border-b-2 font-medium ${activeTab === 'sessions' ? 'border-apex-text text-apex-text' : 'border-transparent text-apex-on-surface-variant hover:text-apex-text'}`}>
          By Session
        </button>
        <button onClick={() => setActiveTab("byItem")} className={`px-4 py-2 border-b-2 font-medium ${activeTab === 'byItem' ? 'border-apex-text text-apex-text' : 'border-transparent text-apex-on-surface-variant hover:text-apex-text'}`}>
          Sale by Item
        </button>
      </div>

      {activeTab === "sessions" ? (
      <>
      <div className="flex items-center gap-4">
        {selectedDate && (
          <button 
            onClick={() => { setSelectedDate(null); setSelectedSeller(null); }}
            className="p-2 hover:bg-apex-surface-low rounded-xl transition-colors text-apex-on-surface-variant"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <div>
          {!selectedDate ? (
            <Link href={returnPath} className="hover:opacity-80 transition-opacity">
              <h1 className="text-3xl font-display font-bold text-apex-text">Sales Sessions</h1>
            </Link>
          ) : (
            <h1 className="text-3xl font-display font-bold text-apex-text">
              Session: {selectedDate}
            </h1>
          )}
          <p className="text-apex-on-surface-variant mt-2">
            {!selectedDate ? "Daily sales folders organized by session." : "Detailed breakdown of sales and seller performance."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-apex-on-surface-variant" size={32} />
        </div>
      ) : !selectedDate ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(session => (
            <button
              key={session.dateStr}
              onClick={() => setSelectedDate(session.dateStr)}
              className="bg-apex-surface p-5 rounded-2xl border border-apex-outline shadow-sm hover:shadow-md transition-all text-left group flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${session.isToday ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                    {session.isToday ? <FolderOpen size={24} /> : <Folder size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-apex-text">{session.dateStr}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${session.isToday ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {session.isToday ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-apex-outline-variant">
                <div>
                  <div className="text-xs text-apex-on-surface-variant font-medium">Revenue</div>
                  <div className="font-bold text-apex-text text-lg">KES {session.totalRevenue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-apex-on-surface-variant font-medium">Margin</div>
                  <div className="font-bold text-emerald-600 text-lg flex items-center gap-1">
                    <TrendingUp size={14} /> KES {session.totalMargin.toLocaleString()}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="col-span-full py-12 text-center text-apex-on-surface-variant bg-apex-surface rounded-2xl border border-apex-outline border-dashed">
              No sales sessions found.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-apex-surface p-6 rounded-2xl border border-apex-outline shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt size={24} />
              </div>
              <div>
                <p className="text-apex-on-surface-variant text-sm font-medium">Session Revenue</p>
                <p className="text-2xl font-display font-bold text-apex-text">KES {activeSession?.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-apex-surface p-6 rounded-2xl border border-apex-outline shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-apex-on-surface-variant text-sm font-medium">Session Margin</p>
                <p className="text-2xl font-display font-bold text-emerald-600">KES {activeSession?.totalMargin.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-apex-surface rounded-2xl border border-apex-outline shadow-sm overflow-hidden">
            <div className="p-5 border-b border-apex-outline bg-apex-surface-highest">
              <h2 className="font-bold text-apex-text flex items-center gap-2">
                <User size={18} className="text-apex-on-surface-variant" /> Seller Performance
              </h2>
            </div>
            <div className="divide-y divide-apex-outline">
              {Object.values(sellerData).map(seller => (
                <div key={seller.sellerName} className="flex flex-col">
                  {/* Seller Header Row */}
                  <button 
                    onClick={() => setSelectedSeller(selectedSeller === seller.sellerName ? null : seller.sellerName)}
                    className="p-4 flex items-center justify-between hover:bg-apex-surface-low transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {seller.sellerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-apex-text">{seller.sellerName}</div>
                        <div className="text-xs text-apex-on-surface-variant">{seller.items.length} items sold</div>
                      </div>
                    </div>
                    <div className="text-right flex gap-6">
                      <div>
                        <div className="text-xs text-apex-on-surface-variant">Revenue</div>
                        <div className="font-bold text-apex-text">KES {seller.revenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-apex-on-surface-variant">Margin</div>
                        <div className="font-bold text-emerald-600">KES {seller.margin.toLocaleString()}</div>
                      </div>
                    </div>
                  </button>

                  {/* Seller Items Breakdown */}
                  {selectedSeller === seller.sellerName && (
                    <div className="bg-slate-50/50 p-0 border-t border-b border-apex-outline-variant overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100/50 text-apex-on-surface-variant text-xs">
                          <tr>
                            <th className="py-2 px-4 font-medium">Time</th>
                            <th className="py-2 px-4 font-medium">Receipt</th>
                            <th className="py-2 px-4 font-medium">Product</th>
                            <th className="py-2 px-4 font-medium text-center">Qty</th>
                            <th className="py-2 px-4 font-medium text-right">Price</th>
                            <th className="py-2 px-4 font-medium text-right">Total</th>
                            <th className="py-2 px-4 font-medium text-right">Margin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-apex-outline-variant">
                          {seller.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white transition-colors">
                              <td className="py-2 px-4 text-apex-on-surface-variant whitespace-nowrap"><Clock size={12} className="inline mr-1"/>{item.time}</td>
                              <td className="py-2 px-4 font-mono text-xs text-apex-on-surface-variant">{item.receipt}</td>
                              <td className="py-2 px-4 font-medium text-apex-text">{item.productName}</td>
                              <td className="py-2 px-4 text-center">{item.qty}</td>
                              <td className="py-2 px-4 text-right">KES {item.price.toLocaleString()}</td>
                              <td className="py-2 px-4 text-right font-medium">KES {item.total.toLocaleString()}</td>
                              <td className="py-2 px-4 text-right text-emerald-600 font-medium">KES {item.margin.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </>
      ) : (
        <ByItemTab branchId={branchId} />
      )}
    </div>
  );
}

// ─── By Item Tab ──────────────────────────────────────────────────────────────
function ByItemTab({ branchId }: { branchId?: string | null }) {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProducts().then(data => {
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setProducts(data.map((p: any) => ({id: p.id, name: p.name})).sort((a: any, b: any) => a.name.localeCompare(b.name)));
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedProductId) return;
    let mounted = true;
    async function loadData() {
      setLoading(true);
      const start = new Date(fromDate); start.setHours(0,0,0,0);
      const end = new Date(toDate); end.setHours(23,59,59,999);

      let query = supabase.from('sale_items')
        .select(`
          id, quantity, unit_price, subtotal,
          sales!inner(created_at, receipt_number, branch_id, seller_id, user_profiles(nickname)),
          products(name)
        `)
        .eq('product_id', selectedProductId)
        .gte('sales.created_at', start.toISOString())
        .lte('sales.created_at', end.toISOString());

      if (branchId) {
        query = query.eq('sales.branch_id', branchId);
      } else if (user?.role === 'manager' && user.assigned_branches && user.assigned_branches.length > 0) {
        query = query.in('sales.branch_id', user.assigned_branches);
      }

      const { data } = await query;
      if (mounted) {
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.sort((a: any, b: any) => new Date(b.sales.created_at).getTime() - new Date(a.sales.created_at).getTime());
          setItems(data);
        }
        setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false };
  }, [selectedProductId, fromDate, toDate, branchId, user, supabase]);

  const totalQty = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalRevenue = items.reduce((acc, curr) => acc + curr.subtotal, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 bg-apex-surface p-4 rounded-2xl shadow-sm border border-apex-outline w-full items-end">
        <div className="w-full sm:w-1/3">
          <label className="block text-xs font-bold text-apex-on-surface-variant uppercase tracking-wider mb-2">Select Product</label>
          <select 
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            className="w-full px-4 py-2.5 bg-apex-surface border border-apex-outline rounded-xl focus:ring-2 focus:ring-apex-text focus:border-transparent outline-none transition-all shadow-sm text-apex-text"
          >
            <option value="">-- Choose a product --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <DatePicker date={fromDate} setDate={setFromDate} label="From Date" />
        <DatePicker date={toDate} setDate={setToDate} label="To Date" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-apex-on-surface-variant" /></div>
      ) : selectedProductId ? (
        <div className="bg-apex-surface border border-apex-outline rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-apex-outline flex justify-between items-center bg-apex-surface-highest">
            <h3 className="font-bold text-apex-text text-lg">Sales for Product</h3>
            <div className="text-right text-sm text-apex-on-surface-variant">
              Total: <span className="font-bold text-apex-text">{totalQty} units</span> (KES {totalRevenue.toLocaleString()})
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/50 text-apex-on-surface-variant border-b border-apex-outline">
                <tr>
                  <th className="p-4 font-medium">Time</th>
                  <th className="p-4 font-medium">Receipt</th>
                  <th className="p-4 font-medium">Seller</th>
                  <th className="p-4 font-medium text-center">Qty</th>
                  <th className="p-4 font-medium text-right">Price</th>
                  <th className="p-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apex-outline-variant">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-apex-surface-low cursor-pointer">
                    <td className="p-4 text-apex-on-surface-variant whitespace-nowrap">
                      {new Date(item.sales.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-xs">{item.sales.receipt_number || item.sales.id.split('-')[0]}</td>
                    <td className="p-4">{item.sales.user_profiles?.nickname || 'Unknown'}</td>
                    <td className="p-4 text-center font-bold">{item.quantity}</td>
                    <td className="p-4 text-right">KES {item.unit_price.toLocaleString()}</td>
                    <td className="p-4 text-right font-medium">KES {item.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-apex-on-surface-variant">
                      No sales found for this product in the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-apex-outline rounded-2xl bg-apex-surface">
          <Package className="mx-auto text-apex-on-surface-variant mb-3" size={32} />
          <h3 className="text-lg font-medium text-apex-text">Select a product</h3>
          <p className="text-apex-on-surface-variant mt-1">Choose a product from the dropdown to see its sales history.</p>
        </div>
      )}
    </div>
  );
}
