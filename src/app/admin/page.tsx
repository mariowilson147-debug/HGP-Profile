"use client";

import { useEffect, useState } from "react";
import { getUsers } from "@/lib/auth-actions";
import Link from "next/link";
import { Package, Plus, MessageSquare, Users, Download, Settings, Bookmark } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function AdminDashboard() {
  const [totalStaff, setTotalStaff] = useState(0);
  const { user } = useAuth();

  const loadStaffCount = async () => {
    try {
      const staff = await getUsers();
      setTotalStaff(staff.length);
    } catch (e) {
      console.error("Failed to load staff count", e);
    }
  };

  useEffect(() => {
    loadStaffCount();
  }, []);

  return (
    <div className="w-full bg-slate-50 min-h-full">

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Huge Launchpad Grid (Primary View) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-12 mt-6">
          
          {/* Products Card */}
          <Link href="/admin/products" className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col group block">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-slate-50 text-slate-800 rounded-full flex items-center justify-center">
                <Package size={24} strokeWidth={2} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-semibold rounded-md">
                <Bookmark size={12} /> Active
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">CATALOG</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Product Inventory</h3>
            <div className="flex gap-2 mb-8 flex-wrap">
              <span className="px-3 py-1 bg-slate-100/80 text-slate-600 text-xs font-semibold rounded-md">Manage</span>
              <span className="px-3 py-1 bg-slate-100/80 text-slate-600 text-xs font-semibold rounded-md">Pricing</span>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2">
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-slate-900">Manage Catalog</span>
                <span className="text-[11px] text-slate-400 font-medium">In Database</span>
              </div>
              <div className="px-5 py-2.5 bg-[#0f172a] text-white text-xs font-bold rounded-xl group-hover:bg-slate-700 transition-colors">
                Open now
              </div>
            </div>
          </Link>

          {/* New Product Card */}
          <Link href="/admin/product/new" className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col group block">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Plus size={24} strokeWidth={2} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-semibold rounded-md">
                <Bookmark size={12} /> Setup
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">ADDITIONS</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">New Product</h3>
            <div className="flex gap-2 mb-8 flex-wrap">
              <span className="px-3 py-1 bg-slate-100/80 text-slate-600 text-xs font-semibold rounded-md">Create</span>
              <span className="px-3 py-1 bg-slate-100/80 text-slate-600 text-xs font-semibold rounded-md">Upload</span>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2">
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-slate-900">Add Entry</span>
                <span className="text-[11px] text-slate-400 font-medium">To Catalog</span>
              </div>
              <div className="px-5 py-2.5 bg-[#0f172a] text-white text-xs font-bold rounded-xl group-hover:bg-slate-700 transition-colors">
                Create
              </div>
            </div>
          </Link>

          {/* Staff Card */}
          <Link href="/admin/users" className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col group block">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <Users size={24} strokeWidth={2} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-semibold rounded-md">
                <Bookmark size={12} /> HR
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">TEAM</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Staff Management</h3>
            <div className="flex gap-2 mb-8 flex-wrap">
              <span className="px-3 py-1 bg-slate-100/80 text-slate-600 text-xs font-semibold rounded-md">Roles</span>
              <span className="px-3 py-1 bg-slate-100/80 text-slate-600 text-xs font-semibold rounded-md">Access</span>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2">
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-slate-900">{totalStaff} Users</span>
                <span className="text-[11px] text-slate-400 font-medium">Registered staff</span>
              </div>
              <div className="px-5 py-2.5 bg-[#0f172a] text-white text-xs font-bold rounded-xl group-hover:bg-slate-700 transition-colors">
                Manage
              </div>
            </div>
          </Link>

          {/* Exports Card */}
          <Link href="/admin/exports" className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col group block">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                <Download size={24} strokeWidth={2} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-semibold rounded-md">
                <Bookmark size={12} /> Share
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">DOCUMENTS</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Data Exports</h3>
            <div className="flex gap-2 mb-8 flex-wrap">
              <span className="px-3 py-1 bg-slate-100/80 text-slate-600 text-xs font-semibold rounded-md">PDF</span>
              <span className="px-3 py-1 bg-slate-100/80 text-slate-600 text-xs font-semibold rounded-md">Excel</span>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2">
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-slate-900">Download</span>
                <span className="text-[11px] text-slate-400 font-medium">Generate reports</span>
              </div>
              <div className="px-5 py-2.5 bg-[#0f172a] text-white text-xs font-bold rounded-xl group-hover:bg-slate-700 transition-colors">
                Export
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
