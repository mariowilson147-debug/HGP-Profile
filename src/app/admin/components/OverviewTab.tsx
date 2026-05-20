/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Package, MessageSquare, Users, Bookmark, TrendingUp, Activity, Search, ChevronDown, PieChart, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function OverviewTab({ stats }: { stats: any }) {
  const { user } = useAuth();
  const userName = user?.email?.split('@')[0] || "Admin";
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* Deep Blue Header Section inspired by image */}
      <div className="bg-[#1f4e79] pt-8 pb-20 px-8 relative shadow-inner">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold text-white">Welcome, {displayName}</h1>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-sm transition-colors border border-white/20">
                <ClockIcon /> Last 4 Hours <ChevronDown size={14} />
              </button>
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-sm transition-colors border border-white/20">
                <RefreshIcon /> 10s <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* KPI Row (integrated into the blue header) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 bg-[#255b8c] rounded shadow-lg border border-[#183d5d]">
            
            {/* KPI 1 */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-[#1f4e79] flex items-center gap-4">
              <div className="w-10 h-10 border border-white/20 rounded flex items-center justify-center text-white shrink-0">
                <Search size={18} />
              </div>
              <div>
                <p className="text-blue-100 text-xs font-medium mb-1">Total Products</p>
                <div className="flex items-end gap-3">
                  <h4 className="text-2xl font-bold text-white">{stats.totalProducts}</h4>
                  <span className="text-emerald-400 text-[10px] flex items-center font-bold">↗ 12%</span>
                </div>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-[#1f4e79] flex items-center gap-4">
              <div className="w-10 h-10 border border-white/20 rounded flex items-center justify-center text-white shrink-0">
                <Package size={18} />
              </div>
              <div>
                <p className="text-blue-100 text-xs font-medium mb-1">Active Categories</p>
                <div className="flex items-end gap-3">
                  <h4 className="text-2xl font-bold text-white">{stats.activeCategories}</h4>
                  <span className="text-blue-300 text-[10px] flex items-center font-bold">→ 0.00</span>
                </div>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-6 border-b md:border-b-0 lg:border-r border-[#1f4e79] flex items-center gap-4">
              <div className="w-10 h-10 border border-white/20 rounded flex items-center justify-center text-white shrink-0">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="text-blue-100 text-xs font-medium mb-1">Inquiries Raised</p>
                <div className="flex items-end gap-3">
                  <h4 className="text-2xl font-bold text-white">{stats.totalInquiries}</h4>
                  <span className="text-emerald-400 text-[10px] flex items-center font-bold">↗ 5%</span>
                </div>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 border border-white/20 rounded flex items-center justify-center text-white shrink-0">
                <Users size={18} />
              </div>
              <div>
                <p className="text-blue-100 text-xs font-medium mb-1">Total Staff</p>
                <div className="flex items-end gap-3">
                  <h4 className="text-2xl font-bold text-white">{stats.staffCount}</h4>
                  <span className="text-red-400 text-[10px] flex items-center font-bold">↘ 1%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area (White background, pulled up to overlap the blue slightly) */}
      <div className="max-w-[1400px] mx-auto px-8 -mt-10 relative z-10 space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Card 1 */}
          <div className="bg-white p-6 shadow-sm rounded border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#333] font-medium text-sm">Product Distribution</h3>
              <DownloadIcon />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8 h-48 justify-center">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-[#1f4e79]">{stats.totalProducts}</p>
                <p className="text-[9px] text-slate-400 mt-1">From {new Date().toLocaleDateString()}</p>
              </div>
              <div className="w-40 h-40 rounded-full border-[16px] border-[#1f4e79] border-r-blue-300 border-t-emerald-400 relative flex items-center justify-center">
                 <span className="font-bold text-slate-300 text-lg">Products</span>
              </div>
            </div>
          </div>

          {/* Chart Card 2 */}
          <div className="bg-white p-6 shadow-sm rounded border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#333] font-medium text-sm">Category Metrics</h3>
              <DownloadIcon />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8 h-48 justify-center">
               <div className="w-full flex items-end justify-around h-32 px-4">
                 <div className="w-8 bg-[#1f4e79] h-[80%] rounded-t relative"><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">Light</span></div>
                 <div className="w-8 bg-emerald-400 h-[60%] rounded-t relative"><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">Bath</span></div>
                 <div className="w-8 bg-blue-300 h-[30%] rounded-t relative"><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">Elec</span></div>
                 <div className="w-8 bg-[#255b8c] h-[50%] rounded-t relative"><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">Other</span></div>
               </div>
            </div>
          </div>
        </div>

        {/* Recently Added Table (replaces the dark list) */}
        <div className="bg-white shadow-sm rounded border border-slate-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[#333] font-medium text-sm flex items-center gap-2">
              Recently Added Products
            </h3>
            <Link href="/admin/products" className="text-xs text-blue-600 hover:underline">View Full Catalog</Link>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-3 text-[10px] uppercase font-semibold text-slate-500">Product</th>
                <th className="px-6 py-3 text-[10px] uppercase font-semibold text-slate-500">Category</th>
                <th className="px-6 py-3 text-[10px] uppercase font-semibold text-slate-500">Date Added</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentlyAddedProducts.slice(0, 4).map((p: any) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-medium text-slate-800">{p.name}</span>
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-600">{p.category}</td>
                  <td className="px-6 py-3 text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {stats.recentlyAddedProducts.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-400">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:stroke-blue-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
