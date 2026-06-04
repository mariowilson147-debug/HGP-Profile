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

  useEffect(() => {
    // Stats are passed as props
  }, []);



  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 font-apex-sans max-w-[1400px] mx-auto">
      
      {/* Dashboard Top Header */}
      <div className="flex justify-between items-end pb-4 gap-4 mt-4 mb-2">
        <div>
          <h2 className="font-apex-sans text-3xl font-bold text-apex-text tracking-tight">
            Dashboard
          </h2>
          <p className="font-apex-sans text-sm text-apex-on-surface-variant mt-1">
            System overview and key metrics
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="px-3 py-1 bg-apex-tertiary-container text-apex-tertiary font-apex-sans font-bold text-[10px] tracking-wider rounded-full uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-apex-tertiary rounded-full"></span>
            System Online
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Products (White Card) */}
        <div className="bg-apex-surface border border-apex-outline-variant shadow-sm rounded-2xl p-6 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="font-apex-sans text-sm text-apex-on-surface-variant font-medium">Total Products</span>
            <div className="w-8 h-8 rounded-full bg-apex-surface-highest flex items-center justify-center">
              <ClipboardList size={16} className="text-apex-text" />
            </div>
          </div>
          <div>
            <p className="font-apex-sans text-4xl text-apex-text font-bold tracking-tight">{stats.totalProducts?.toLocaleString() || 0}</p>
            <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-1">In Registry</p>
          </div>
        </div>

        {/* KPI 2: Categories (White Card) */}
        <div className="bg-apex-surface border border-apex-outline-variant shadow-sm rounded-2xl p-6 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="font-apex-sans text-sm text-apex-on-surface-variant font-medium">Categories</span>
            <div className="w-8 h-8 rounded-full bg-apex-surface-highest flex items-center justify-center">
              <Shapes size={16} className="text-apex-text" />
            </div>
          </div>
          <div>
            <p className="font-apex-sans text-4xl text-apex-text font-bold tracking-tight">{stats.activeCategories?.toLocaleString() || 0}</p>
            <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-1">Active Sectors</p>
          </div>
        </div>

        {/* KPI 3: Inquiries (Dark Card matching reference) */}
        <div className="bg-apex-primary text-apex-bg rounded-2xl p-6 flex flex-col justify-between h-40 shadow-md">
          <div className="flex justify-between items-start">
            <span className="font-apex-sans text-sm text-apex-bg/80 font-medium">Total Inquiries</span>
            <div className="w-8 h-8 rounded-full bg-apex-bg/20 flex items-center justify-center">
              <MessageSquare size={16} className="text-apex-bg" />
            </div>
          </div>
          <div>
            <p className="font-apex-sans text-4xl text-apex-bg font-bold tracking-tight">{stats.totalInquiries?.toLocaleString() || 0}</p>
            <p className="font-apex-sans text-xs text-apex-bg/60 mt-1">Client Messages</p>
          </div>
        </div>

        {/* KPI 4: Staff (Dark Card matching reference) */}
        <div className="bg-apex-primary text-apex-bg rounded-2xl p-6 flex flex-col justify-between h-40 shadow-md">
          <div className="flex justify-between items-start">
            <span className="font-apex-sans text-sm text-apex-bg/80 font-medium">Registered Staff</span>
            <div className="w-8 h-8 rounded-full bg-apex-bg/20 flex items-center justify-center">
              <UserCheck size={16} className="text-apex-bg" />
            </div>
          </div>
          <div>
            <p className="font-apex-sans text-4xl text-apex-bg font-bold tracking-tight">{stats.staffCount?.toLocaleString() || 0}</p>
            <p className="font-apex-sans text-xs text-apex-bg/60 mt-1">Authorized Nodes</p>
          </div>
        </div>

      </div>

      {/* Quick Shortcuts */}
      <div className="mt-8">
        <h3 className="font-apex-sans text-lg font-bold text-apex-text mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/product/new" className="bg-apex-surface border border-apex-outline-variant hover:border-apex-primary/50 shadow-sm rounded-xl p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5 group">
            <div className="w-10 h-10 rounded-full bg-apex-primary/10 flex items-center justify-center text-apex-primary group-hover:bg-apex-primary group-hover:text-apex-bg transition-colors">
              <Package size={20} />
            </div>
            <div>
              <p className="font-apex-sans font-bold text-apex-text text-sm">Add New Product</p>
              <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-0.5">Create a new item in registry</p>
            </div>
          </Link>
          
          <Link href="/admin?tab=categories" className="bg-apex-surface border border-apex-outline-variant hover:border-apex-primary/50 shadow-sm rounded-xl p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5 group text-left block w-full">
            <div className="w-10 h-10 rounded-full bg-apex-tertiary/10 flex items-center justify-center text-apex-tertiary group-hover:bg-apex-tertiary group-hover:text-apex-bg transition-colors">
              <Shapes size={20} />
            </div>
            <div>
              <p className="font-apex-sans font-bold text-apex-text text-sm">Manage Categories</p>
              <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-0.5">Edit or add new sectors</p>
            </div>
          </Link>

          <Link href="/admin/exports" className="bg-apex-surface border border-apex-outline-variant hover:border-apex-primary/50 shadow-sm rounded-xl p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5 group">
            <div className="w-10 h-10 rounded-full bg-apex-secondary/10 flex items-center justify-center text-apex-secondary group-hover:bg-apex-secondary group-hover:text-apex-bg transition-colors">
              <Download size={20} />
            </div>
            <div>
              <p className="font-apex-sans font-bold text-apex-text text-sm">Data Exports</p>
              <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-0.5">Generate PDF or Excel</p>
            </div>
          </Link>
          <Link href="/admin/pos" className="bg-apex-surface border border-apex-outline-variant hover:border-apex-primary/50 shadow-sm rounded-xl p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5 group">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-apex-bg transition-colors">
              <Activity size={20} />
            </div>
            <div>
              <p className="font-apex-sans font-bold text-apex-text text-sm">Point of Sale</p>
              <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-0.5">Process new orders</p>
            </div>
          </Link>
          <Link href="/admin/sessions" className="bg-apex-surface border border-apex-outline-variant hover:border-apex-primary/50 shadow-sm rounded-xl p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5 group">
            <div className="w-10 h-10 rounded-full bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-500 group-hover:bg-fuchsia-500 group-hover:text-apex-bg transition-colors">
              <History size={20} />
            </div>
            <div>
              <p className="font-apex-sans font-bold text-apex-text text-sm">Sales Sessions</p>
              <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-0.5">View & reverse sales</p>
            </div>
          </Link>
          <Link href="/admin/catalogue" className="bg-apex-surface border border-apex-outline-variant hover:border-apex-primary/50 shadow-sm rounded-xl p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5 group">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-apex-bg transition-colors">
              <Tag size={20} />
            </div>
            <div>
              <p className="font-apex-sans font-bold text-apex-text text-sm">Catalogue</p>
              <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-0.5">Browse products & prices</p>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}
