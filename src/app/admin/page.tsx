/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { getUsers } from "@/lib/auth-actions";
import { getProducts, getChatThreads, Product } from "@/lib/actions";
import { useAuth } from "@/components/AuthProvider";
import { useSearchParams } from "next/navigation";
import OverviewTab from "./components/OverviewTab";

import CategoriesTab from "./components/CategoriesTab";

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [staffCount, setStaffCount] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedProducts, fetchedStaff, fetchedChats] = await Promise.all([
        getProducts(),
        getUsers(),
        getChatThreads()
      ]);
      setProducts(fetchedProducts || []);
      setStaffCount(fetchedStaff.length || 0);
      setMessages(fetchedChats || []);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const totalInquiries = messages.length;

    const categories = new Map<string, { count: number, products: any[] }>();
    products.forEach(p => {
      const c = p.category || 'Uncategorized';
      if (!categories.has(c)) {
        categories.set(c, { count: 0, products: [] });
      }
      const cat = categories.get(c)!;
      cat.count++;
      cat.products.push(p);
    });

    const categoryStats = Array.from(categories.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      products: data.products
    }));

    // Replaced "trending" with "recently added"
    const recentlyAddedProducts = [...products].sort((a, b) => {
      if (!a.created_at || !b.created_at) return 0;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return {
      totalProducts: products.length,
      activeCategories: categories.size,
      totalInquiries,
      products,
      categoryStats,
      recentlyAddedProducts,
      recentMessages: messages,
      staffCount
    };
  }, [products, messages, staffCount]);

  return (
    <div className="w-full bg-transparent min-h-full pb-20">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="relative animate-in fade-in duration-500">
            {activeTab === 'overview' && <OverviewTab stats={stats} />}
            {activeTab === 'categories' && <CategoriesTab />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
