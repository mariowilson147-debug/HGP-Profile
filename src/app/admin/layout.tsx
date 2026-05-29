"use client";

import { Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminChatSidebar from "@/components/AdminChatSidebar";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, useRef } from "react";
import { getChatThreads, getSystemMetrics } from "@/lib/actions";
import { 
  Bell, 
  User, 
  LogOut, 
  Terminal, 
  Database, 
  Activity, 
  Tag, 
  MessageSquare, 
  Users, 
  Download, 
  Settings, 
  HelpCircle,
  Menu,
  X,
  Moon,
  Sun
} from "lucide-react";

function AdminSidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const activeTab = searchParams.get("tab") || "overview";

  const navLinks = [
    { name: "Command", href: "/admin", active: pathname === "/admin" && activeTab === "overview", icon: Terminal },
    { name: "Registry", href: "/admin/products", active: pathname === "/admin/products" || (pathname === "/admin" && activeTab === "categories"), icon: Database },
    { name: "Nodes", href: "/admin/users", active: pathname === "/admin/users", icon: Users },
    { name: "Branches", href: "/admin/branches", active: pathname === "/admin/branches", icon: Activity },
    { name: "Inventory", href: "/admin/inventory", active: pathname === "/admin/inventory", icon: Database },
    { name: "Adjustments", href: "/admin/adjustments", active: pathname === "/admin/adjustments", icon: Activity },
    { name: "Procurement", href: "/admin/procurement", active: pathname === "/admin/procurement", icon: Download },
    { name: "Transfers", href: "/admin/transfers", active: pathname === "/admin/transfers", icon: Activity },
    { name: "Reports", href: "/admin/reports", active: pathname === "/admin/reports", icon: Tag },
  ];

  return (
    <nav className="flex-1 space-y-2 py-4 px-4">
      {navLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link 
            key={link.name} 
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-lg ${
              link.active 
                ? 'bg-apex-surface-highest text-apex-text font-semibold shadow-sm' 
                : 'text-apex-on-surface-variant hover:bg-apex-surface-low hover:text-apex-text'
            }`}
          >
            <Icon size={18} className={link.active ? 'text-apex-text' : 'text-apex-on-surface-variant'} />
            <span className="font-apex-sans text-sm">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [threads, setThreads] = useState<{
    session_id: string;
    name: string;
    updated_at: string;
    last_message: string;
    has_unread: boolean;
  }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      getChatThreads().then(data => setThreads(data));
    } else {
      // Fetch initial unread count on mount
      getChatThreads().then(data => setThreads(data));
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = threads.filter(t => t.has_unread).length;

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:text-apex-text transition-colors"
      >
        <Bell size={18} className="text-apex-on-surface-variant group-hover:text-apex-text" />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-apex-error rounded-full"></span>}
      </button>

      {isOpen && (
        <div className="absolute top-10 right-0 w-80 bg-apex-surface-low border border-apex-outline-variant/30 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col font-apex-sans">
          <div className="px-4 py-3 border-b border-apex-outline-variant/20 bg-apex-bg flex justify-between items-center">
            <h3 className="text-apex-text font-semibold text-sm">Recent Messages</h3>
            {unreadCount > 0 && <span className="text-xs bg-apex-error-container text-apex-error px-2 py-0.5 rounded-full font-medium">{unreadCount} UNREAD</span>}
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {threads.length === 0 ? (
              <div className="px-4 py-8 text-center text-apex-on-surface-variant text-sm">
                No active comms
              </div>
            ) : (
              threads.slice(0, 5).map(thread => (
                <div key={thread.session_id} className="p-4 border-b border-apex-outline-variant/10 hover:bg-apex-surface/50 transition-colors cursor-pointer text-left">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs ${thread.has_unread ? 'text-apex-text font-bold' : 'text-apex-on-surface-variant'}`}>
                      {thread.name || "Unknown Entity"}
                    </span>
                    <span className="text-xs text-apex-on-surface-variant">
                      {new Date(thread.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-apex-on-surface-variant line-clamp-2 leading-relaxed">
                    {thread.last_message}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-apex-outline-variant/20 bg-apex-bg text-center">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-apex-primary hover:text-apex-primary/80 transition-colors w-full py-1"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();
  const userName = user?.email?.split('@')[0] || "Admin";
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  
  const [theme, setTheme] = useState("light");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("adminTheme") || "light";
    setTheme(storedTheme);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.add('disable-transitions');
    
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("adminTheme", newTheme);

    setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 50);
  };
  
  return (
    <ProtectedRoute reqRole="admin">
      <div className={`admin-workspace flex min-h-screen w-full bg-apex-bg text-apex-text font-apex-sans selection:bg-apex-secondary/30 relative ${theme === 'dark' ? 'dark' : ''}`}>
        
        {/* SideNavBar Shell */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        )}
        <aside className={`h-screen w-64 fixed left-0 top-0 bg-apex-surface border-r border-apex-outline-variant/50 flex flex-col py-8 z-50 transform transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
          <div className="px-6 mb-8 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-apex-primary text-apex-bg flex items-center justify-center font-bold">A</div>
              <h1 className="font-apex-sans text-xl font-bold text-apex-text">Admin</h1>
            </div>
            <button 
              className="lg:hidden text-apex-on-surface-variant hover:text-apex-text"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>
          
          <Suspense fallback={<div className="flex-1 w-full bg-apex-surface-low animate-pulse" />}>
            <AdminSidebarNav />
          </Suspense>

          <div className="px-6 mt-auto space-y-4">
            
            <Link 
              href="/admin/exports" 
              className="w-full bg-apex-primary text-apex-bg py-3 font-apex-sans font-bold text-sm rounded hover:opacity-90 active:scale-95 transition-all duration-150 text-center flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              Export Data
            </Link>
          </div>
        </aside>

        {/* Right Side Content Canvas Wrapper */}
        <div className="flex-1 flex flex-col pl-0 lg:pl-64 w-full min-h-screen relative z-10 transition-all duration-300">
          {/* Mobile Top Header */}
          <div className="lg:hidden fixed top-0 left-0 w-full h-[60px] bg-apex-bg border-b border-apex-outline-variant/50 flex items-center px-4 z-40">
            <button 
              className="text-apex-on-surface-variant hover:text-apex-text p-2 -ml-2"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="ml-4 font-bold text-apex-text">Admin</div>
          </div>

          {/* Floating Vertical Toolbar (Right Edge) */}
          <div className="fixed top-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
            
            {/* Row 1: Search + Profile */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Expandable Search */}
              <div className="group flex items-center bg-apex-surface/80 backdrop-blur-md border border-apex-outline shadow-sm rounded-full overflow-hidden transition-all duration-300 w-10 hover:w-[250px] focus-within:w-[250px] h-10 hidden sm:flex">
                <div className="w-10 h-10 flex items-center justify-center shrink-0 text-apex-on-surface-variant group-hover:text-apex-primary transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search globally..." 
                  className="bg-transparent border-none outline-none text-sm text-apex-text w-full pr-4" 
                />
              </div>

              {/* Profile */}
              <div 
                className="w-10 h-10 rounded-full bg-apex-surface border border-apex-outline shadow-sm overflow-hidden flex items-center justify-center cursor-pointer hover:border-apex-primary transition-colors shrink-0 relative group"
                onClick={logout}
              >
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=apex" alt="avatar" className="w-full h-full object-cover" />
                <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-apex-surface-highest text-apex-text text-xs font-bold px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm border border-apex-outline">
                  Logout {displayName}
                </div>
              </div>
            </div>

            {/* Row 2: Notification Bell */}
            <div className="pointer-events-auto bg-apex-surface/80 backdrop-blur-md border border-apex-outline shadow-sm rounded-full flex items-center justify-center w-10 h-10 hover:border-apex-primary transition-colors">
              <NotificationDropdown />
            </div>

            {/* Row 3: Theme Toggle */}
            <div className="pointer-events-auto bg-apex-surface/80 backdrop-blur-md border border-apex-outline shadow-sm rounded-full flex items-center justify-center w-10 h-10 hover:border-apex-primary transition-colors">
              <button 
                onClick={toggleTheme} 
                className="w-full h-full flex items-center justify-center text-apex-on-surface-variant hover:text-apex-text transition-colors"
                title="Toggle Theme"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>
          </div>

          {/* Main Content Canvas */}
          <main className="flex-grow w-full relative pt-[80px] lg:pt-8 pb-16 min-h-screen px-4 sm:px-8">
            {children}
          </main>
        </div>

        <AdminChatSidebar />
      </div>
    </ProtectedRoute>
  );
}

