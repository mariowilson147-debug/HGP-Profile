"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Download, Plus, Settings, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useSettings } from "@/components/SettingsProvider";
import AdminChatSidebar from "@/components/AdminChatSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useSettings();



  return (
    <ProtectedRoute reqRole="admin">
      <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
        {/* Top Floating Navigation Elements */}
        <header className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-8 z-50 pointer-events-none">
          <div className="flex items-center gap-8 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <span className="font-signature text-3xl font-bold text-slate-800 tracking-tight mt-1 hover:text-blue-600 transition-colors">
                  Prutam
                </span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 pointer-events-auto bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-full px-4 py-2">
            <Link
              href="/admin/settings"
              className="p-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors text-slate-500"
              title="Settings"
            >
              <Settings size={18} />
            </Link>
            
            <div className="h-5 w-px bg-slate-300"></div>

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
        <main className="flex-1 overflow-y-auto pt-20">
          {children}
        </main>
        
        <AdminChatSidebar />
      </div>
    </ProtectedRoute>
  );
}
