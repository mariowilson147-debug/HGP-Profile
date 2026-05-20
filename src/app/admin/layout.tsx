"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AdminChatSidebar from "@/components/AdminChatSidebar";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Bell, User, LogOut } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  
  const activeTab = searchParams.get("tab") || "overview";

  const navLinks = [
    { name: "Dashboard", href: "/admin", active: pathname === "/admin" && activeTab === "overview" },
    { name: "Intelligence", href: "/admin?tab=intelligence", active: pathname === "/admin" && activeTab === "intelligence" },
    { name: "Categories", href: "/admin?tab=categories", active: pathname === "/admin" && activeTab === "categories" },
    { name: "Inquiries", href: "/admin?tab=inquiries", active: pathname === "/admin" && activeTab === "inquiries" },
    { name: "Products", href: "/admin/products", active: pathname === "/admin/products" },
    { name: "Staff", href: "/admin/users", active: pathname === "/admin/users" },
    { name: "Exports", href: "/admin/exports", active: pathname === "/admin/exports" },
  ];

  return (
    <ProtectedRoute reqRole="admin">
      <div className="flex flex-col min-h-screen w-full bg-[#f4f7f6] font-sans">
        
        {/* Top Navigation Bar (Deep Blue Enterprise Style) */}
        <header className="bg-[#1f4e79] text-white shadow-md z-40 sticky top-0 border-b border-[#183d5d]">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-10">
              <Link href="/" className="font-extrabold tracking-wider text-2xl flex items-center gap-2">
                IFS
              </Link>
              
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`px-4 py-5 text-sm font-medium border-b-4 transition-colors ${
                      link.active 
                        ? 'border-white text-white' 
                        : 'border-transparent text-blue-100 hover:text-white hover:border-blue-300'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-6">
              <button className="text-blue-100 hover:text-white transition-colors relative">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1f4e79]"></span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                  <User size={16} />
                </div>
                <button 
                  onClick={logout}
                  title="Logout"
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full relative pb-20">
          {children}
        </main>
        
        <AdminChatSidebar />
      </div>
    </ProtectedRoute>
  );
}
