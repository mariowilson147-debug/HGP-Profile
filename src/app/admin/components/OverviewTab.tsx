/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { 
  Package, 
  MessageSquare, 
  Users, 
  Tag,
  Clock, 
  Database,
  History,
  CloudLightning,
  ShieldCheck,
  Zap,
  Download,
  Upload,
  ClipboardList,
  Shapes,
  UserCheck,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getSystemMetrics } from "@/lib/actions";

export default function OverviewTab({ stats }: { stats: any }) {
  const { user } = useAuth();
  const userName = user?.email?.split('@')[0] || "Admin";
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  const [metrics, setMetrics] = useState({
    uptimeStr: "000:00:00:00",
    dbRegion: "CONNECTING..."
  });

  useEffect(() => {
    getSystemMetrics().then(m => setMetrics(m));
    const interval = setInterval(() => {
      getSystemMetrics().then(m => setMetrics(m));
    }, 10000);
    return () => clearInterval(interval);
  }, []);



  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 font-apex-sans max-w-[1400px] mx-auto">
      
      {/* Dashboard Top Header */}
      <div className="flex justify-between items-end pb-4 gap-4 mt-4 border-b border-apex-outline-variant/10">
        <div>
          <h2 className="font-apex-sans text-3xl font-black text-apex-text tracking-tight uppercase">
            COMMAND CENTER: OVERVIEW
          </h2>
          <p className="font-apex-mono text-xs text-apex-secondary mt-1">
            LATENCY: 14MS {"//"} ENCRYPTION: AES-256 {"//"} STATUS: NOMINAL
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="px-3 py-1 bg-apex-surface-lowest border border-apex-surface-highest text-apex-secondary font-apex-sans font-bold text-[10px] tracking-wider rounded uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-apex-secondary rounded-full apex-glow-accent"></span>
            LIVE STREAM ACTIVE
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Products */}
        <div className="apex-glass-panel p-6 flex flex-col justify-between h-36 group relative border-t-0 border-r-0 border-b-0 border-l-[3px] border-l-transparent hover:border-l-apex-secondary/50 transition-colors duration-500">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-apex-secondary/50"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-apex-secondary/50"></div>
          <div className="flex justify-between items-start">
            <span className="font-apex-sans text-sm text-apex-on-surface-variant opacity-80 tracking-widest uppercase">TOTAL PRODUCTS</span>
            <ClipboardList size={18} className="text-apex-secondary/60 group-hover:text-apex-secondary transition-colors" />
          </div>
          <div>
            <p className="font-apex-sans text-5xl text-apex-text leading-none font-bold tracking-tight">{stats.totalProducts?.toLocaleString() || 0}</p>
            <p className="font-apex-sans text-xs text-apex-secondary mt-2 tracking-wide uppercase">IN REGISTRY</p>
          </div>
        </div>

        {/* KPI 2: Categories */}
        <div className="apex-glass-panel p-6 flex flex-col justify-between h-36 group relative border-t-0 border-r-0 border-b-0 border-l-[3px] border-l-transparent hover:border-l-apex-primary/50 transition-colors duration-500">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-apex-primary/50"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-apex-primary/50"></div>
          <div className="flex justify-between items-start">
            <span className="font-apex-sans text-sm text-apex-on-surface-variant opacity-80 tracking-widest uppercase">CATEGORIES</span>
            <Shapes size={18} className="text-apex-on-surface-variant group-hover:text-apex-primary transition-colors" />
          </div>
          <div>
            <p className="font-apex-sans text-5xl text-apex-text leading-none font-bold tracking-tight">{stats.activeCategories?.toLocaleString() || 0}</p>
            <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-2 tracking-wide uppercase">ACTIVE SECTORS</p>
          </div>
        </div>

        {/* KPI 3: Staff */}
        <div className="apex-glass-panel p-6 flex flex-col justify-between h-36 group relative border-t-0 border-r-0 border-b-0 border-l-[3px] border-l-transparent hover:border-l-apex-tertiary/50 transition-colors duration-500">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-apex-tertiary/50"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-apex-tertiary/50"></div>
          <div className="flex justify-between items-start">
            <span className="font-apex-sans text-sm text-apex-on-surface-variant opacity-80 tracking-widest uppercase">REGISTERED STAFF</span>
            <UserCheck size={18} className="text-apex-on-surface-variant group-hover:text-apex-tertiary transition-colors" />
          </div>
          <div>
            <p className="font-apex-sans text-5xl text-apex-text leading-none font-bold tracking-tight">{stats.staffCount?.toLocaleString() || 0}</p>
            <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-2 tracking-wide uppercase">AUTHORIZED NODES</p>
          </div>
        </div>

        {/* KPI 4: Exports */}
        <div className="apex-glass-panel p-6 flex flex-col justify-between h-36 group relative border-t-0 border-r-0 border-b-0 border-l-[3px] border-l-transparent hover:border-l-apex-secondary/50 transition-colors duration-500">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-apex-secondary/50"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-apex-secondary/50"></div>
          <div className="flex justify-between items-start">
            <span className="font-apex-sans text-sm text-apex-on-surface-variant opacity-80 tracking-widest uppercase">TOTAL INQUIRIES</span>
            <MessageSquare size={18} className="text-apex-secondary/60 group-hover:text-apex-secondary transition-colors" />
          </div>
          <div>
            <p className="font-apex-sans text-5xl text-apex-text leading-none font-bold tracking-tight">{stats.totalInquiries?.toLocaleString() || 0}</p>
            <p className="font-apex-sans text-xs text-apex-secondary mt-2 tracking-wide uppercase">CLIENT MESSAGES</p>
          </div>
        </div>

      </div>

      {/* Technical Detail Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-apex-surface-low border border-apex-outline-variant/20 p-6 flex flex-col justify-center relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-apex-secondary/80"></div>
          <p className="font-apex-sans text-xs text-apex-on-surface-variant tracking-wider uppercase mb-2">Database Sync Status</p>
          <div className="flex items-start gap-3 mt-1 text-apex-text">
            <div className="w-2 h-2 bg-apex-secondary rounded-full apex-glow-accent mt-2"></div>
            <p className="font-apex-mono text-sm uppercase tracking-wider font-bold">CONNECTED:<br/>{metrics.dbRegion}</p>
          </div>
        </div>
        
        <div className="bg-apex-surface-low border border-apex-outline-variant/20 p-6 flex flex-col justify-center relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-apex-primary/40"></div>
          <p className="font-apex-sans text-xs text-apex-on-surface-variant tracking-wider uppercase mb-2">System Uptime</p>
          <div className="flex items-end gap-4 mt-1 text-apex-text">
            <p className="font-apex-mono text-xl uppercase tracking-wider font-bold">{metrics.uptimeStr}</p>
            <p className="font-apex-sans text-[10px] text-apex-text font-bold mb-1 tracking-widest">99.99% PERCENTILE</p>
          </div>
        </div>
      </div>

    </div>
  );
}
