"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Download, Plus, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useSettings } from "@/components/SettingsProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Staff Management", href: "/admin/users", icon: Users },
    { label: "Exports", href: "/admin/exports", icon: Download },
  ];

  return (
    <ProtectedRoute reqRole="admin">
      <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
        {/* Top Navigation */}
        <header className="h-16 bg-white text-slate-600 flex items-center justify-between px-6 shrink-0 border-b border-slate-200 z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              {settings.companyLogoUrl ? (
                <img src={settings.companyLogoUrl} alt={settings.companyName} className="h-16 object-contain mix-blend-multiply scale-150 origin-left" />
              ) : (
                <h2 className="text-xl font-display font-bold text-slate-800 tracking-tight">{settings.companyName}</h2>
              )}
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      isActive 
                        ? "bg-blue-50 text-blue-600 font-medium" 
                        : "hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
              
              <Link 
                href="/admin/product/new"
                className="flex items-center gap-2 px-3 py-2 ml-2 bg-blue-100 hover:bg-white text-blue-900 rounded-lg transition-colors font-medium text-sm"
              >
                <Plus size={16} /> New Product
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/settings"
              className="p-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors text-slate-500"
              title="Settings"
            >
              <Settings size={18} />
            </Link>
            
            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                  {user?.email?.[0].toUpperCase() || "A"}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                  {user?.email?.split('@')[0] || "Admin"}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors ml-1"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
