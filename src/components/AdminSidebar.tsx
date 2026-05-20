"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Package, Users, Download, PieChart, MessageSquare, Lightbulb, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  const activeTab = searchParams.get("tab") || "overview";

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, active: pathname === "/admin" && activeTab === "overview" },
    { name: "Intelligence", href: "/admin?tab=intelligence", icon: Lightbulb, active: pathname === "/admin" && activeTab === "intelligence" },
    { name: "Categories", href: "/admin?tab=categories", icon: PieChart, active: pathname === "/admin" && activeTab === "categories" },
    { name: "Inquiries", href: "/admin?tab=inquiries", icon: MessageSquare, active: pathname === "/admin" && activeTab === "inquiries" },
    { name: "Products", href: "/admin/products", icon: Package, active: pathname === "/admin/products" },
    { name: "Staff & Users", href: "/admin/users", icon: Users, active: pathname === "/admin/users" },
    { name: "Exports", href: "/admin/exports", icon: Download, active: pathname === "/admin/exports" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0a0a0b] text-slate-300 w-64 border-r border-slate-800 shadow-2xl">
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-signature text-3xl font-bold text-white tracking-tight hover:text-blue-400 transition-colors">
            IFS
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md ml-2">Admin</span>
        </Link>
        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
        <div className="px-3 text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 mt-4">Menu</div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                item.active 
                  ? "bg-blue-600/10 text-blue-400" 
                  : "hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon 
                size={18} 
                className={`${item.active ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300"} transition-colors`} 
                strokeWidth={item.active ? 2.5 : 2}
              />
              {item.name}
              
              {item.active && (
                <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800/60 bg-[#0f0f11]">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
            {user?.email?.[0].toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.email?.split('@')[0] || "Admin"}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-800/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl text-sm font-medium transition-colors border border-slate-700/50 hover:border-red-500/30"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-slate-900 text-white rounded-xl shadow-lg flex items-center justify-center"
        onClick={() => setIsOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen sticky top-0 shrink-0 z-40 relative">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-64 shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
