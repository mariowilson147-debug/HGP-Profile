"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2, TrendingUp, DollarSign, PieChart, Receipt, Download } from "lucide-react";
import Link from "next/link";
import DatePicker from "@/components/ui/DatePicker";
import SelectDropdown from "@/components/ui/SelectDropdown";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';

type SaleItem = {
  quantity: number;
  unit_price: number;
  subtotal: number;
  unit_cost?: number | null;
  unit_cost_used?: number | null;
  total_cost?: number | null;
  margin?: number | null;
  products: {
    name: string;
    category: string;
    buying_price: number;
  } | null;
};

/** Immutable COGS from sale snapshot; never recompute from live products.buying_price */
function saleItemUnitCost(item: SaleItem): number {
  if (item.unit_cost_used != null && item.unit_cost_used > 0) return item.unit_cost_used;
  if (item.unit_cost != null && item.unit_cost > 0) return item.unit_cost;
  // Legacy rows only — prefer not to use catalogue price for historical accuracy
  return item.products?.buying_price || 0;
}

function saleItemCost(item: SaleItem): number {
  if (item.total_cost != null && item.total_cost > 0) return item.total_cost;
  return saleItemUnitCost(item) * item.quantity;
}

function saleItemMargin(item: SaleItem): number {
  if (item.margin != null) return item.margin;
  return item.subtotal - saleItemCost(item);
}

type SaleRecord = {
  id: string;
  created_at: string;
  total_amount: number;
  seller_id: string;
  status?: string;
  sale_items: SaleItem[];
  user_profiles: { nickname: string } | null;
};

export default function ReportsView({ branchId, returnPath = "/manager" }: { branchId?: string | null, returnPath?: string }) {
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [salesData, setSalesData] = useState<SaleRecord[]>([]);
  const [adminBranchFilter, setAdminBranchFilter] = useState<string>("all");
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (!branchId) {
      supabase.from('branches').select('id, name').order('name').then(({ data }) => {
        if (data) setBranches(data);
      });
    }
  }, [branchId, supabase]);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);

      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      // Fetch sales with immutable COGS from sale_items (not live products.buying_price)
      let query = supabase
        .from('sales')
        .select(`
          id,
          created_at,
          total_amount,
          seller_id,
          status,
          sale_items (
            quantity,
            unit_price,
            subtotal,
            unit_cost,
            unit_cost_used,
            total_cost,
            margin,
            products (
              name,
              category,
              buying_price
            )
          ),
          user_profiles!seller_id (
            nickname
          )
        `)
        .neq('status', 'reversed')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      } else if (adminBranchFilter !== "all") {
        query = query.eq('branch_id', adminBranchFilter);
      }

      const { data } = await query;
      if (data) {
        setSalesData(data as unknown as SaleRecord[]);
      }
      setLoading(false);
    }
    
    fetchReports();
  }, [branchId, fromDate, toDate, adminBranchFilter, supabase]);

  if (!branchId && branchId !== undefined && branchId !== null) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-apex-text mb-2">No Branch Selected</h2>
        <p className="text-apex-on-surface-variant">Please select a branch from the dashboard first.</p>
      </div>
    );
  }

  // Calculate Aggregates
  let totalRevenue = 0;
  let totalCost = 0;
  let totalItemsSold = 0;
  
  const itemSales: Record<string, { qty: number; revenue: number; margin: number }> = {};
  const sellerSales: Record<string, { revenue: number; margin: number }> = {};
  const categorySales: Record<string, { revenue: number; margin: number }> = {};

  salesData.forEach(sale => {
    totalRevenue += sale.total_amount;
    
    const sellerName = sale.user_profiles?.nickname || "Unknown Seller";
    if (!sellerSales[sellerName]) sellerSales[sellerName] = { revenue: 0, margin: 0 };
    sellerSales[sellerName].revenue += sale.total_amount;

    let saleCost = 0;
    
    sale.sale_items?.forEach((item: SaleItem) => {
      const prod = item.products;
      if (!prod) return;
      
      const itemCost = saleItemCost(item);
      const itemMargin = saleItemMargin(item);
      
      totalCost += itemCost;
      saleCost += itemCost;
      totalItemsSold += item.quantity;

      // Item Aggregates
      if (!itemSales[prod.name]) itemSales[prod.name] = { qty: 0, revenue: 0, margin: 0 };
      itemSales[prod.name].qty += item.quantity;
      itemSales[prod.name].revenue += item.subtotal;
      itemSales[prod.name].margin += itemMargin;

      // Category Aggregates
      if (!categorySales[prod.category]) categorySales[prod.category] = { revenue: 0, margin: 0 };
      categorySales[prod.category].revenue += item.subtotal;
      categorySales[prod.category].margin += itemMargin;
    });

    sellerSales[sellerName].margin += (sale.total_amount - saleCost);
  });

  const totalMargin = totalRevenue - totalCost;
  const marginPercentage = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100).toFixed(1) : "0.0";

  // Chart Data Preparation
  const categoryChartData = Object.entries(categorySales).map(([name, data]) => ({
    name,
    Revenue: data.revenue,
    Profit: data.margin
  })).sort((a,b) => b.Revenue - a.Revenue);

  const trendDataMap: Record<string, { date: string; Revenue: number; Profit: number }> = {};
  salesData.forEach(sale => {
    const date = new Date(sale.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!trendDataMap[date]) trendDataMap[date] = { date, Revenue: 0, Profit: 0 };
    trendDataMap[date].Revenue += sale.total_amount;
    
    let saleCost = 0;
    sale.sale_items?.forEach((item: SaleItem) => {
      saleCost += saleItemCost(item);
    });
    trendDataMap[date].Profit += (sale.total_amount - saleCost);
  });
  // Sales data is descending, so we reverse it to chronological order for the trend chart
  const trendData = Object.values(trendDataMap).reverse();

  const handleExportCSV = () => {
    const headers = ["Date", "Receipt ID", "Seller", "Total Amount", "Profit Margin"];
    const rows = salesData.map(sale => {
      let cost = 0;
      sale.sale_items?.forEach((item: SaleItem) => {
        cost += saleItemCost(item);
      });
      const margin = sale.total_amount - cost;
      
      const dateStr = `${new Date(sale.created_at).toLocaleDateString()} ${new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      const sellerName = sale.user_profiles?.nickname || 'Unknown';
      const receiptId = sale.id.split('-')[0];
      
      return `"${dateStr}","${receiptId}","${sellerName}","${sale.total_amount}","${margin}"`;
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href={returnPath} className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-display font-bold text-apex-text">{branchId ? "Reports Hub" : "Global Reports"}</h1>
          </Link>
          <p className="text-apex-on-surface-variant mt-2">{branchId ? "Deep analytics, margins, and sales history." : "Aggregated analytics and sales across all branches."}</p>
        </div>
        
        <div className="flex z-10 flex-col sm:flex-row gap-4 bg-apex-surface p-2 rounded-2xl shadow-sm border border-apex-outline items-center">
          {!branchId && (
            <div className="flex items-center gap-2 px-2 border-r border-apex-outline mr-2 pr-4 h-full">
              <span className="text-sm font-medium text-apex-on-surface-variant">Branch:</span>
              <SelectDropdown
                value={adminBranchFilter}
                onChange={setAdminBranchFilter}
                options={[{ label: "All Branches", value: "all" }, ...branches.map(b => ({ label: b.name, value: b.id }))]}
                placeholder="All Branches"
                className="w-40"
              />
            </div>
          )}
          <DatePicker 
            date={fromDate} 
            setDate={setFromDate} 
            label="From Date"
          />
          <DatePicker 
            date={toDate} 
            setDate={setToDate} 
            label="To Date"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex justify-center items-center">
          <Loader2 className="animate-spin text-apex-on-surface-variant" size={32} />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-apex-surface p-6 rounded-2xl border border-apex-outline shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-apex-on-surface-variant text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-display font-bold text-apex-text">KES {totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-apex-surface p-6 rounded-2xl border border-apex-outline shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-apex-on-surface-variant text-sm font-medium">Total Profit (Margin)</p>
                <p className="text-2xl font-display font-bold text-apex-text">KES {totalMargin.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-apex-surface p-6 rounded-2xl border border-apex-outline shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <PieChart size={24} />
              </div>
              <div>
                <p className="text-apex-on-surface-variant text-sm font-medium">Margin Percentage</p>
                <p className="text-2xl font-display font-bold text-apex-text">{marginPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trend Chart */}
            <div className="bg-apex-surface p-6 rounded-2xl border border-apex-outline shadow-sm">
              <h2 className="font-bold text-apex-text mb-6">Revenue & Profit Trend</h2>
              <div className="h-72 w-full">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `K${value/1000}k`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any) => [`KES ${Number(value || 0).toLocaleString()}`, undefined]}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                      <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProf)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-apex-on-surface-variant">No trend data available</div>
                )}
              </div>
            </div>

            {/* Category Performance */}
            <div className="bg-apex-surface p-6 rounded-2xl border border-apex-outline shadow-sm">
              <h2 className="font-bold text-apex-text mb-6">Category Performance</h2>
              <div className="h-72 w-full">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                      <RechartsTooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any) => [`KES ${Number(value || 0).toLocaleString()}`, undefined]}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="Revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                      <Bar dataKey="Profit" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-apex-on-surface-variant">No category data available</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sales by Item */}
            <div className="bg-apex-surface rounded-2xl border border-apex-outline shadow-sm overflow-hidden">
              <div className="p-5 border-b border-apex-outline-variant bg-apex-surface-highest">
                <h2 className="font-bold text-apex-text">Top Performing Items</h2>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-apex-on-surface-variant">
                    <tr>
                      <th className="p-4 font-medium">Item</th>
                      <th className="p-4 font-medium text-right">Qty</th>
                      <th className="p-4 font-medium text-right">Revenue</th>
                      <th className="p-4 font-medium text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-apex-outline-variant">
                    {Object.entries(itemSales).sort((a,b) => b[1].margin - a[1].margin).slice(0,5).map(([name, data]) => (
                      <tr key={name} className="hover:bg-apex-surface-low">
                        <td className="p-4 font-medium text-apex-text truncate max-w-[150px]">{name}</td>
                        <td className="p-4 text-right text-apex-on-surface-variant">{data.qty}</td>
                        <td className="p-4 text-right font-medium">KES {data.revenue.toLocaleString()}</td>
                        <td className="p-4 text-right font-bold text-emerald-600">KES {data.margin.toLocaleString()}</td>
                      </tr>
                    ))}
                    {Object.keys(itemSales).length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-apex-on-surface-variant">No sales data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Seller Performance */}
            <div className="bg-apex-surface rounded-2xl border border-apex-outline shadow-sm overflow-hidden">
              <div className="p-5 border-b border-apex-outline-variant bg-apex-surface-highest">
                <h2 className="font-bold text-apex-text">Seller Performance</h2>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-apex-on-surface-variant">
                    <tr>
                      <th className="p-4 font-medium">Seller</th>
                      <th className="p-4 font-medium text-right">Revenue</th>
                      <th className="p-4 font-medium text-right">Profit Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-apex-outline-variant">
                    {Object.entries(sellerSales).sort((a,b) => b[1].revenue - a[1].revenue).map(([name, data]) => (
                      <tr key={name} className="hover:bg-apex-surface-low">
                        <td className="p-4 font-medium text-apex-text">{name}</td>
                        <td className="p-4 text-right font-medium">KES {data.revenue.toLocaleString()}</td>
                        <td className="p-4 text-right font-bold text-emerald-600">KES {data.margin.toLocaleString()}</td>
                      </tr>
                    ))}
                    {Object.keys(sellerSales).length === 0 && (
                      <tr><td colSpan={3} className="p-8 text-center text-apex-on-surface-variant">No sales data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Receipts */}
          <div className="bg-apex-surface rounded-2xl border border-apex-outline shadow-sm overflow-hidden">
            <div className="p-5 border-b border-apex-outline-variant bg-apex-surface-highest flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="text-apex-on-surface-variant" size={20} />
                <h2 className="font-bold text-apex-text">Recent Receipts</h2>
              </div>
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-apex-on-surface-variant">
                  <tr>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Receipt ID</th>
                    <th className="p-4 font-medium">Seller</th>
                    <th className="p-4 font-medium text-right">Revenue</th>
                    <th className="p-4 font-medium text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apex-outline-variant">
                  {salesData.slice(0, 10).map(sale => {
                    let cost = 0;
                    sale.sale_items?.forEach((item: SaleItem) => {
                      cost += saleItemCost(item);
                    });
                    const margin = sale.total_amount - cost;
                    
                    return (
                      <tr key={sale.id} className="hover:bg-apex-surface-low">
                        <td className="p-4 text-apex-on-surface-variant">
                          {new Date(sale.created_at).toLocaleDateString()} {new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="p-4 font-mono text-xs text-apex-on-surface-variant">{sale.id.split('-')[0]}</td>
                        <td className="p-4 font-medium text-apex-text">{sale.user_profiles?.nickname || 'Unknown'}</td>
                        <td className="p-4 text-right font-medium">KES {sale.total_amount.toLocaleString()}</td>
                        <td className="p-4 text-right font-bold text-emerald-600">KES {margin.toLocaleString()}</td>
                      </tr>
                    )
                  })}
                  {salesData.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-apex-on-surface-variant">No receipts found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
