"use client";

import Link from "next/link";
import { 
  Package, 
  BookOpen, 
  Inbox, 
  Settings,
  BarChart3,
  Briefcase,
  Users,
  ShoppingCart,
  ArrowRightLeft,
  Calculator
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useManagerBranch } from "@/components/ManagerBranchProvider";
import SelectDropdown from "@/components/ui/SelectDropdown";

const modules = [
  {
    id: "pos",
    title: "Point of Sale",
    description: "Process new orders and check out customers in-store.",
    icon: Package,
    href: "/manager/pos",
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600"
  },
  {
    id: "catalogue",
    title: "Catalogue",
    description: "Browse the full product registry with pricing details.",
    icon: BookOpen,
    href: "/manager/catalogue",
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600"
  },
  {
    id: "inventory",
    title: "Inventory",
    description: "Manage branch stock levels and view total valuation.",
    icon: Inbox,
    href: "/manager/inventory",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600"
  },
  {
    id: "adjustments",
    title: "Adjustments",
    description: "Correct stock levels and view adjustment histories.",
    icon: Calculator,
    href: "/manager/adjustments",
    color: "bg-cyan-500",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-600"
  },
  {
    id: "staff",
    title: "Staff Management",
    description: "Add new sellers and manage wholesale buyers.",
    icon: Users,
    href: "/manager/users",
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600"
  },
  {
    id: "purchases",
    title: "Procurement",
    description: "Record new stock purchases and view histories.",
    icon: ShoppingCart,
    href: "/manager/purchases",
    color: "bg-teal-500",
    bgColor: "bg-teal-50",
    textColor: "text-teal-600"
  },
  {
    id: "transfers",
    title: "Stock Transfers",
    description: "Move inventory between branches and view status.",
    icon: ArrowRightLeft,
    href: "/manager/transfers",
    color: "bg-rose-500",
    bgColor: "bg-rose-50",
    textColor: "text-rose-600"
  },
  {
    id: "reports",
    title: "Reports Hub",
    description: "Deep analytics on sales, margins, and seller performance.",
    icon: BarChart3,
    href: "/manager/reports",
    color: "bg-indigo-500",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-600"
  },
  {
    id: "sessions",
    title: "Sales Sessions",
    description: "View daily sales folders, receipt histories, and seller drilldowns.",
    icon: Briefcase,
    href: "/manager/sessions",
    color: "bg-fuchsia-500",
    bgColor: "bg-fuchsia-50",
    textColor: "text-fuchsia-600"
  },
  {
    id: "settings",
    title: "Settings",
    description: "Update your profile, nickname, and account security.",
    icon: Settings,
    href: "/manager/settings",
    color: "bg-slate-500",
    bgColor: "bg-slate-50",
    textColor: "text-slate-600"
  }
];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { selectedBranchId, setSelectedBranchId, availableBranches } = useManagerBranch();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">
            Manager Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Welcome back, {user?.nickname || "Manager"}. Select a module below to begin.
          </p>
        </div>

        {/* Branch Selector */}
        {availableBranches.length > 0 && (
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500 pl-2">Active Branch:</span>
            <SelectDropdown
              value={selectedBranchId || ""}
              onChange={setSelectedBranchId}
              options={availableBranches.map(b => ({ label: b.name, value: b.id }))}
              placeholder="Select Branch"
              className="w-48"
            />
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link 
              key={mod.id} 
              href={mod.href}
              className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all block relative overflow-hidden"
            >
              {/* Decorative background element */}
              <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${mod.color}`} />
              
              <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-rotate-3 ${mod.bgColor} ${mod.textColor}`}>
                <Icon size={24} />
              </div>
              
              <h3 className="text-xl font-display font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                {mod.title}
              </h3>
              
              <p className="text-slate-500 text-sm leading-relaxed">
                {mod.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
