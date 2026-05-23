/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Activity, Globe } from "lucide-react";

export default function AnalyticsTab({ stats }: { stats: any }) {
  const { totalProducts, activeCategories, totalInquiries } = stats;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-apex-sans selection:bg-apex-secondary/30">
      
      {/* Header Section */}
      <div className="flex justify-between items-end pb-4 border-b border-apex-outline-variant mb-6">
        <div>
          <h2 className="text-2xl font-bold text-apex-text tracking-tight">Analytics Overview</h2>
          <p className="font-apex-sans text-sm text-apex-on-surface-variant mt-1">System telemetry and metrics</p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-apex-surface border border-apex-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-apex-on-surface-variant mb-1">Total Products</p>
          <h4 className="text-4xl font-bold text-apex-text">{totalProducts}</h4>
        </div>
        <div className="bg-apex-surface border border-apex-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-apex-on-surface-variant mb-1">Active Categories</p>
          <h4 className="text-4xl font-bold text-apex-text">{activeCategories}</h4>
        </div>
        <div className="bg-apex-surface border border-apex-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-apex-on-surface-variant mb-1">Total Inquiries</p>
          <h4 className="text-4xl font-bold text-apex-primary">{totalInquiries}</h4>
        </div>
      </div>

      {/* Analytics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-apex-surface border border-apex-outline-variant rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-medium text-base text-apex-text mb-4 flex items-center gap-2">
            <Activity className="text-apex-primary" size={20} />
            Product Views
          </h3>
          <div className="flex flex-col items-center justify-center py-16 text-apex-on-surface-variant">
            <Activity size={40} strokeWidth={1.5} className="mb-3 text-apex-on-surface-variant/50" />
            <p className="text-sm font-medium">Tracking initialized</p>
            <p className="text-xs mt-1 text-center max-w-xs text-apex-on-surface-variant/80">Product view data will appear here.</p>
          </div>
        </div>

        <div className="bg-apex-surface border border-apex-outline-variant rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-medium text-base text-apex-text mb-4 flex items-center gap-2">
            <Globe className="text-apex-primary" size={20} />
            Search Analytics
          </h3>
          <div className="flex flex-col items-center justify-center py-16 text-apex-on-surface-variant">
            <Globe size={40} strokeWidth={1.5} className="mb-3 text-apex-on-surface-variant/50" />
            <p className="text-sm font-medium">Search gathering active</p>
            <p className="text-xs mt-1 text-center max-w-xs text-apex-on-surface-variant/80">Popular search terms will list here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
