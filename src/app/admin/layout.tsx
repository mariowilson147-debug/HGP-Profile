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
  X
} from "lucide-react";

function AdminSidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const activeTab = searchParams.get("tab") || "overview";

  const navLinks = [
    { name: "Command", href: "/admin", active: pathname === "/admin" && activeTab === "overview", icon: Terminal },
    { name: "Registry", href: "/admin/products", active: pathname === "/admin/products" || (pathname === "/admin" && activeTab === "categories"), icon: Database },

    { name: "Nodes", href: "/admin/users", active: pathname === "/admin/users", icon: Users },
  ];

  return (
    <nav className="flex-1 space-y-1 py-4">
      {navLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link 
            key={link.name} 
            href={link.href}
            className={`flex items-center gap-3 px-6 py-3 transition-all duration-300 border-l-2 ${
              link.active 
                ? 'text-apex-secondary border-apex-secondary bg-apex-secondary/10 shadow-[0_0_15px_rgba(76,215,246,0.15)] font-bold' 
                : 'border-transparent text-apex-on-surface-variant hover:bg-apex-surface-high hover:text-apex-secondary'
            }`}
          >
            <Icon size={18} className={link.active ? 'text-apex-secondary' : 'text-apex-on-surface-variant'} />
            <span className="font-apex-sans text-sm tracking-wide">{link.name}</span>
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
            <h3 className="text-apex-text font-bold text-xs uppercase tracking-widest">Recent Messages</h3>
            {unreadCount > 0 && <span className="text-[9px] bg-apex-error/20 text-apex-error px-2 py-0.5 rounded font-apex-mono tracking-widest">{unreadCount} UNREAD</span>}
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {threads.length === 0 ? (
              <div className="px-4 py-8 text-center text-apex-on-surface-variant/50 text-[10px] font-apex-mono uppercase tracking-widest">
                No active comms
              </div>
            ) : (
              threads.slice(0, 5).map(thread => (
                <div key={thread.session_id} className="p-4 border-b border-apex-outline-variant/10 hover:bg-apex-surface/50 transition-colors cursor-pointer text-left">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs ${thread.has_unread ? 'text-apex-text font-bold' : 'text-apex-on-surface-variant'}`}>
                      {thread.name || "Unknown Entity"}
                    </span>
                    <span className="text-[9px] text-apex-secondary font-apex-mono opacity-60">
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
              className="text-[9px] text-apex-primary hover:text-apex-text font-apex-mono uppercase tracking-widest transition-colors w-full py-1"
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
  
  const [metrics, setMetrics] = useState({
    loadPercent: "0.0%",
    threadCount: 0
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    getSystemMetrics().then(m => setMetrics(m));
    const interval = setInterval(() => {
      getSystemMetrics().then(m => setMetrics(m));
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <ProtectedRoute reqRole="admin">
      <div className="admin-workspace flex min-h-screen w-full bg-apex-bg text-apex-text font-apex-sans selection:bg-apex-secondary/30 relative">
        
        {/* SideNavBar Shell */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        )}
        <aside className={`h-screen w-64 fixed left-0 top-0 bg-apex-bg border-r border-apex-outline-variant/30 flex flex-col py-8 z-50 transform transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
          <div className="px-6 mb-8 flex justify-between items-start">
            <div>
              <h1 className="font-apex-sans text-3xl font-black text-apex-primary tracking-tighter leading-none uppercase">ifs</h1>
              <p className="font-apex-mono text-[9px] text-apex-secondary tracking-widest mt-2 uppercase font-bold">V3.0 COMMAND CENTER</p>
            </div>
            <button 
              className="lg:hidden text-apex-on-surface-variant hover:text-apex-text"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>
          
          <Suspense fallback={<div className="flex-1 w-full bg-white/5 animate-pulse" />}>
            <AdminSidebarNav />
          </Suspense>

          <div className="px-6 mt-auto space-y-4">
            
            <Link 
              href="/admin/exports" 
              className="w-full bg-apex-primary text-apex-bg py-3 font-apex-sans font-bold text-sm rounded hover:brightness-110 active:scale-95 transition-all duration-150 text-center flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(192,193,255,0.2)]"
            >
              Export Data
            </Link>
          </div>
        </aside>

        {/* Right Side Content Canvas Wrapper */}
        <div className="flex-1 flex flex-col pl-0 lg:pl-64 w-full min-h-screen relative z-10 transition-all duration-300">
          {/* TopNavBar Shell */}
          <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] h-[72px] bg-apex-bg/95 backdrop-blur-md border-b border-apex-outline-variant/20 flex justify-between items-center px-4 lg:px-8 z-40 transition-all duration-300">
            <div className="flex items-center gap-4 flex-1">
              <button 
                className="lg:hidden text-apex-on-surface-variant hover:text-apex-text p-2 -ml-2"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
              <div className="relative w-full max-w-[400px] group hidden sm:block">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant/50">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
                <input 
                  className="w-full bg-apex-surface-low border border-apex-outline-variant/20 rounded focus:ring-1 focus:ring-apex-secondary/50 text-apex-text font-apex-mono text-[10px] pl-10 pr-4 h-9 tracking-widest placeholder:opacity-40 focus:outline-none" 
                  placeholder="QUERY REGISTRY..." 
                  type="text"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-apex-on-surface-variant">
                <NotificationDropdown />
              </div>
              
              <div className="flex items-center gap-4 ml-2 pl-6">
                <div className="text-right">
                  <p className="font-apex-sans text-xs font-bold leading-none text-apex-text uppercase tracking-wider">{displayName}</p>
                  <p className="font-apex-mono text-[9px] text-apex-secondary tracking-widest mt-1 font-bold">LEVEL 4 CLEARANCE</p>
                </div>
                <div 
                  className="w-9 h-9 rounded bg-apex-surface-low overflow-hidden border border-apex-secondary/30 flex items-center justify-center text-apex-secondary shrink-0 cursor-pointer hover:border-apex-error/50 transition-colors"
                  onClick={logout}
                  title="Logout"
                >
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=apex" alt="avatar" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Canvas */}
          <main className="flex-grow w-full relative pt-20 pb-16 min-h-screen">
            {children}
          </main>
        </div>

        {/* Global Visual Decoration (HUD Elements) */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] z-0">
          <div 
            className="absolute top-0 left-0 w-full h-full" 
            style={{ 
              backgroundImage: 'radial-gradient(var(--color-apex-secondary) 1px, transparent 0)', 
              backgroundSize: '40px 40px' 
            }} 
          />
        </div>

        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 font-apex-mono">
          <div className="flex flex-row items-center justify-center gap-4">
            <div className="apex-glass-panel px-3 py-1 text-[10px] font-apex-mono text-apex-secondary border border-apex-secondary/20 shadow-[0_0_10px_rgba(76,215,246,0.1)]">
              SYSTEM_LOAD: {metrics.loadPercent}%
            </div>
            <div className="apex-glass-panel px-3 py-1 text-[10px] font-apex-mono text-apex-primary border border-apex-primary/20 shadow-[0_0_10px_rgba(192,193,255,0.1)]">
              THREAD_COUNT: {metrics.threadCount}
            </div>
          </div>
        </div>

        <AdminChatSidebar />
      </div>
    </ProtectedRoute>
  );
}

