/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Activity, Globe } from "lucide-react";

export default function AnalyticsTab({ stats }: { stats: any }) {
  const { totalProducts, activeCategories, totalInquiries } = stats;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Products</p>
          <h4 className="text-4xl font-bold text-slate-900">{totalProducts}</h4>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Categories</p>
          <h4 className="text-4xl font-bold text-slate-900">{activeCategories}</h4>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Inquiries</p>
          <h4 className="text-4xl font-bold text-slate-900">{totalInquiries}</h4>
        </div>
      </div>

      {/* Analytics Placeholder (real data available after product_views table is populated) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="text-blue-500" size={20} />
            Product Views
          </h3>
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Activity size={40} strokeWidth={1} className="mb-3 text-slate-200" />
            <p className="text-sm font-medium">Tracking starts automatically</p>
            <p className="text-xs mt-1">Views will appear here as customers browse your catalog.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Globe className="text-emerald-500" size={20} />
            Search Analytics
          </h3>
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Globe size={40} strokeWidth={1} className="mb-3 text-slate-200" />
            <p className="text-sm font-medium">Search data is being collected</p>
            <p className="text-xs mt-1">Popular search terms will appear here as users browse.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
