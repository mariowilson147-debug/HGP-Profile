/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Activity, Globe } from "lucide-react";

export default function AnalyticsTab({ stats }: { stats: any }) {
  const { totalProducts, activeCategories, totalInquiries } = stats;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-apex-sans selection:bg-apex-secondary/30">
      
      {/* Header Section */}
      <div className="flex justify-between items-end pb-4 border-b border-apex-outline-variant/10 mb-2">
        <div>
          <span className="text-apex-secondary font-apex-mono text-[10px] uppercase tracking-widest">Database Registry // 007</span>
          <h2 className="font-apex-sans text-2xl font-black text-apex-text mt-1 uppercase">Analytics Telemetry</h2>
        </div>
        <p className="text-xs text-apex-on-surface-variant/60 font-apex-mono hidden sm:block">SYSTEM_TELEMETRY // ANALYTICS_DAEMON</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="apex-glass-panel border border-apex-outline-variant/20 rounded p-6 flex flex-col justify-center">
          <p className="text-xs font-bold text-apex-on-surface-variant/60 uppercase tracking-widest font-apex-mono mb-1">Total Products</p>
          <h4 className="text-4xl font-apex-sans font-black text-apex-text">{totalProducts}</h4>
        </div>
        <div className="apex-glass-panel border border-apex-outline-variant/20 rounded p-6 flex flex-col justify-center">
          <p className="text-xs font-bold text-apex-on-surface-variant/60 uppercase tracking-widest font-apex-mono mb-1">Active Categories</p>
          <h4 className="text-4xl font-apex-sans font-black text-apex-secondary">{activeCategories}</h4>
        </div>
        <div className="apex-glass-panel border border-apex-outline-variant/20 rounded p-6 flex flex-col justify-center">
          <p className="text-xs font-bold text-apex-on-surface-variant/60 uppercase tracking-widest font-apex-mono mb-1">Total Inquiries</p>
          <h4 className="text-4xl font-apex-sans font-black text-apex-primary">{totalInquiries}</h4>
        </div>
      </div>

      {/* Analytics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="apex-glass-panel border border-apex-outline-variant/20 rounded p-6 flex flex-col bg-apex-surface-low/30">
          <h3 className="font-apex-sans font-bold text-xs uppercase tracking-widest text-apex-text mb-4 flex items-center gap-2">
            <Activity className="text-apex-secondary" size={20} />
            Product Views
          </h3>
          <div className="flex flex-col items-center justify-center py-16 text-apex-on-surface-variant/40 font-apex-mono">
            <Activity size={40} strokeWidth={1} className="mb-3 text-apex-outline/25" />
            <p className="text-sm font-bold">TRACKING INITIALIZATION AUTOMATIC</p>
            <p className="text-[10px] mt-1 uppercase text-center max-w-xs">Views telemetry will print here as nodes query catalog data.</p>
          </div>
        </div>

        <div className="apex-glass-panel border border-apex-outline-variant/20 rounded p-6 flex flex-col bg-apex-surface-low/30">
          <h3 className="font-apex-sans font-bold text-xs uppercase tracking-widest text-apex-text mb-4 flex items-center gap-2">
            <Globe className="text-apex-primary" size={20} />
            Search Analytics
          </h3>
          <div className="flex flex-col items-center justify-center py-16 text-apex-on-surface-variant/40 font-apex-mono">
            <Globe size={40} strokeWidth={1} className="mb-3 text-apex-outline/25" />
            <p className="text-sm font-bold">SEARCH DATA GATHERING SECURE</p>
            <p className="text-[10px] mt-1 uppercase text-center max-w-xs">Popular search tokens will list here dynamically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
