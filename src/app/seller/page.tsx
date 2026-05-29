"use client";

import Link from "next/link";
import { 
  Package, 
  BookOpen, 
  History, 
  Inbox, 
  Settings,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const modules = [
  {
    id: "pos",
    title: "Point of Sale",
    description: "Process new orders and check out customers in-store.",
    icon: Package,
    href: "/seller/pos",
    tags: ["Sales", "Checkout"],
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600"
  },
  {
    id: "catalogue",
    title: "Catalogue",
    description: "Browse the full product registry with pricing details.",
    icon: BookOpen,
    href: "/seller/catalogue",
    tags: ["Products", "Pricing"],
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600"
  },
  {
    id: "inventory",
    title: "Inventory",
    description: "Manage branch stock levels and request replenishments.",
    icon: Inbox,
    href: "/seller/inventory",
    tags: ["Stock", "Management"],
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600"
  },
  {
    id: "sales",
    title: "Sales History",
    description: "View past transactions, receipts, and daily totals.",
    icon: History,
    href: "/seller/sales",
    tags: ["Reports", "History"],
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600"
  },
  {
    id: "actions",
    title: "Actions",
    description: "Accept stock transfers and perform physical stock takes.",
    icon: Inbox,
    href: "/seller/actions",
    tags: ["Transfers", "Audit"],
    color: "bg-rose-500",
    bgColor: "bg-rose-50",
    textColor: "text-rose-600"
  },
  {
    id: "settings",
    title: "Settings",
    description: "Update your profile, nickname, and account security.",
    icon: Settings,
    href: "/seller/settings",
    tags: ["Profile", "Account"],
    color: "bg-slate-500",
    bgColor: "bg-slate-50",
    textColor: "text-slate-600"
  }
];

export default function SellerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">
          Welcome Back {user?.nickname ? user.nickname.charAt(0).toUpperCase() + user.nickname.slice(1) : "Seller"}!
        </h1>
        <p className="text-slate-500 mt-2">
          Select a module below to manage your branch operations.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div 
              key={mod.id}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group"
            >
              {/* Header: Icon & Tags */}
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mod.bgColor}`}>
                  <Icon className={mod.textColor} size={24} strokeWidth={2} />
                </div>
                <div className="flex gap-2">
                  {mod.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Body: Title & Description */}
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {mod.title}
              </h2>
              <p className="text-sm text-slate-500 flex-grow mb-8">
                {mod.description}
              </p>

              {/* Footer: Action Button */}
              <div className="mt-auto">
                <Link 
                  href={mod.href}
                  className="flex items-center justify-between w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Open {mod.title}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
