"use client";

import { ReactNode, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { 
  Store, 
  Package, 
  BookOpen, 
  History, 
  Inbox, 
  Settings, 
  LogOut,
  Menu,
  X,
  Home
} from "lucide-react";

export default function SellerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/seller", icon: Store },
    { name: "POS", href: "/seller/pos", icon: Package },
    { name: "Catalogue", href: "/seller/catalogue", icon: BookOpen },
    { name: "Inventory", href: "/seller/inventory", icon: Inbox },
    { name: "Sales", href: "/seller/sales", icon: History },
    { name: "Actions", href: "/seller/actions", icon: Inbox },
    { name: "Settings", href: "/seller/settings", icon: Settings },
  ];

  return (
    <ProtectedRoute allowedRoles={['seller', 'manager', 'ceo', 'admin']}>
      <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans selection:bg-slate-200">
        
        {/* Minimal Nav for Sub-pages & Logout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex justify-between items-center">
          <div /> {/* Empty div to push logout to the right, replacing the old home button */}
          
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 hover:border-red-200 hover:bg-red-50 font-medium"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
