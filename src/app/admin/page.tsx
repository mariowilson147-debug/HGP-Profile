"use client";

import { useEffect, useState } from "react";
import { getProducts, deleteProduct } from "@/lib/actions";
import { Product } from "@/components/ProductModal";
import Link from "next/link";
import { Plus, Edit, Trash2, Settings, Users } from "lucide-react";

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
      loadProducts();
    }
  };

  return (
    <div className="w-full bg-[#0a0a0a] min-h-[80vh] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-serif text-[#fefefe] mb-2">Product Management</h1>
            <p className="text-[#888] text-sm">Manage your catalog inventory and pricing.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link href="/admin/users" className="flex items-center justify-center gap-2 bg-[#111] border border-[#333] text-[#888] px-6 py-3 rounded-sm text-[11px] font-medium uppercase tracking-[0.2em] hover:text-[#e0e0e0] hover:bg-[#1a1a1a] transition-colors w-full sm:w-auto">
              <Users size={16} /> Users
            </Link>
            <Link href="/admin/settings" className="flex items-center justify-center gap-2 bg-[#111] border border-[#333] text-[#888] px-6 py-3 rounded-sm text-[11px] font-medium uppercase tracking-[0.2em] hover:text-[#e0e0e0] hover:bg-[#1a1a1a] transition-colors w-full sm:w-auto">
              <Settings size={16} /> Settings
            </Link>
            <Link href="/admin/product/new" className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#b39129] to-[#d4af37] text-[#0f0f0f] px-6 py-3 rounded-sm text-xs font-medium uppercase tracking-[0.2em] hover:from-[#d4af37] hover:to-[#ebd483] transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] w-full sm:w-auto">
              <Plus size={16} /> Add Product
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-t-2 border-l-2 border-[#d4af37] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-[#0f0f0f] border border-[#222] rounded-sm overflow-x-auto shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#222] bg-[#111]">
                  <th className="p-5 text-[10px] font-medium text-[#888] uppercase tracking-[0.2em]">Product</th>
                  <th className="p-5 text-[10px] font-medium text-[#888] uppercase tracking-[0.2em]">Category</th>
                  <th className="p-5 text-[10px] font-medium text-[#888] uppercase tracking-[0.2em]">Buying</th>
                  <th className="p-5 text-[10px] font-medium text-[#888] uppercase tracking-[0.2em]">Wholesale</th>
                  <th className="p-5 text-[10px] font-medium text-[#888] uppercase tracking-[0.2em]">Retail</th>
                  <th className="p-5 text-[10px] font-medium text-[#888] uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-[#222] hover:bg-[#1a1a1a]/50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#111] rounded-sm overflow-hidden border border-[#333] shrink-0">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.image_url} alt="" className="w-full h-full object-cover grayscale opacity-80" />
                        </div>
                        <span className="font-serif text-[#e0e0e0] text-lg">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-5 text-xs text-[#888] uppercase tracking-widest">{product.category}</td>
                    <td className="p-5 text-sm text-[#888]">KES {product.buying_price?.toLocaleString()}</td>
                    <td className="p-5 text-sm text-[#d4af37] font-medium">KES {product.wholesale_price?.toLocaleString()}</td>
                    <td className="p-5 text-sm text-[#888] line-through">KES {product.retail_price?.toLocaleString()}</td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-3">
                        <Link href={`/admin/product/${product.id}`} className="p-2 text-[#888] hover:text-[#d4af37] transition-colors" title="Edit">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-[#888] hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-[#888] text-sm">No products found. Add your first premium product to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
