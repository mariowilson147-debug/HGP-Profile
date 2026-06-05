/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Bookmark, Plus, Trash2, Save, Package, LayoutGrid, Plug, Shirt, Home, Wrench, Box, ShoppingCart, Lightbulb, Bath, Sofa, MoreVertical, Filter, CloudLightning, ArrowLeft, ArrowRight } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import { Category, addDbCategory, updateDbCategory, deleteDbCategory, syncCategoriesFromProducts, deleteEmptyCategories, updateProductCategoryName } from "@/lib/actions";
import SelectDropdown from "@/components/ui/SelectDropdown";

const AVAILABLE_ICONS = [
  "Lightbulb", "Bath", "Sofa", "Plug", "Shirt", "Package", "Home", "Wrench", "Box", "ShoppingCart", "LayoutGrid"
];

const IconMap: Record<string, any> = {
  Lightbulb, Bath, Sofa, Plug, Shirt, Package, Home, Wrench, Box, ShoppingCart, LayoutGrid
};

export default function CategoriesTab() {
  const { settings, updateSettings } = useSettings();
  const [localCategories, setLocalCategories] = useState<Category[]>(settings.categories || []);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 72;
  const totalPages = Math.max(1, Math.ceil(localCategories.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleCategories = localCategories.slice(startIndex, startIndex + itemsPerPage);

  const handleAdd = async () => {
    setLoading(true);
    const newCat = {
      name: "New Category",
      sku_prefix: "NEW",
      icon_name: "Package",
      parent_id: null,
      is_featured: false,
      is_visible: true,
      banner_url: null,
      sort_order: localCategories.length
    };
    const { data, error } = await addDbCategory(newCat);
    if (!error && data) {
      setLocalCategories([...localCategories, data]);
      updateSettings({ ...settings, categories: [...localCategories, data] });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      setLoading(true);
      const { error } = await deleteDbCategory(id);
      if (!error) {
        const filtered = localCategories.filter(c => c.id !== id);
        setLocalCategories(filtered);
        updateSettings({ ...settings, categories: filtered });
      }
      setDeletingId(null);
      setLoading(false);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    const { success, count, data, error } = await syncCategoriesFromProducts();
    if (error) {
      alert("Failed to sync: " + error);
    } else if (success && data) {
      setLocalCategories(data);
      updateSettings({ ...settings, categories: data });
      alert(count === 0 ? "All categories are already synced." : `Successfully synced ${count} new categories from products!`);
    }
    setLoading(false);
  };

  const handleDeleteEmpty = async () => {
    if (!window.confirm("Are you sure you want to delete all categories that have no products?")) return;
    setLoading(true);
    const { success, count, data, error } = await deleteEmptyCategories();
    if (error) {
      alert("Failed to delete empty categories: " + error);
    } else if (success && data) {
      setLocalCategories(data);
      updateSettings({ ...settings, categories: data });
      alert(count === 0 ? "No empty categories found to delete." : `Successfully deleted ${count} empty categories!`);
    }
    setLoading(false);
  };

  const handleUpdate = (id: string, field: keyof Category, value: any) => {
    setLocalCategories(localCategories.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = async (id: string) => {
    setLoading(true);
    const cat = localCategories.find(c => c.id === id);
    const oldCat = settings.categories?.find(c => c.id === id);

    if (cat) {
      // If the category name changed, cascade the change to all products
      if (oldCat && oldCat.name !== cat.name) {
        await updateProductCategoryName(oldCat.name, cat.name);
      }

      await updateDbCategory(id, cat);
      updateSettings({ ...settings, categories: localCategories });
    }
    setLoading(false);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 font-apex-sans max-w-[1400px] mx-auto pt-6 px-2 select-none">
      
      {/* Header Section */}
      <div className="flex justify-between items-start pb-4">
        <div>
          <h2 className="text-3xl font-bold text-apex-text tracking-tight">Categories</h2>
          <p className="font-apex-sans text-sm text-apex-on-surface-variant mt-1">
            Manage product categories • {localCategories.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 bg-apex-surface border border-apex-outline-variant text-apex-text hover:bg-apex-surface-low px-4 py-2 font-apex-sans text-sm font-medium transition-colors rounded-lg disabled:opacity-50 shadow-sm"
          >
            <CloudLightning size={16} /> Sync
          </button>
          <button 
            onClick={handleDeleteEmpty}
            disabled={loading}
            className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-4 py-2 font-apex-sans text-sm font-medium transition-colors rounded-lg disabled:opacity-50 shadow-sm"
          >
            <Trash2 size={16} /> Delete Empty
          </button>
          <button className="flex items-center gap-2 bg-apex-surface border border-apex-outline-variant text-apex-text hover:bg-apex-surface-low px-4 py-2 font-apex-sans text-sm font-medium transition-colors rounded-lg shadow-sm">
            <Filter size={16} /> Filter
          </button>
          <button 
            onClick={handleAdd}
            disabled={loading}
            className="bg-apex-primary hover:bg-apex-primary/90 text-apex-bg font-apex-sans text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus size={16} /> New Category
          </button>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-apex-surface border border-apex-outline-variant rounded-xl flex flex-col relative overflow-hidden shadow-sm">
        
        {/* Table Canvas */}
        <div className="overflow-x-auto min-h-64">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-apex-surface-lowest border-b border-apex-outline-variant font-apex-sans text-xs text-apex-on-surface-variant uppercase tracking-wider font-medium">
                <th className="py-4 px-6 w-24">Icon</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Slug</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apex-outline-variant text-apex-text">
              {localCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center flex-col items-center justify-center text-apex-on-surface-variant/40 font-apex-mono">
                    <LayoutGrid size={48} className="mb-4 text-apex-outline/20 mx-auto" strokeWidth={1} />
                    <p className="font-bold text-xs uppercase tracking-widest">NO CATEGORY REGISTRIES DETECTED</p>
                  </td>
                </tr>
              ) : (
                visibleCategories.map((cat) => {
                  const CatIcon = IconMap[cat.icon_name || "Package"] || Package;
                  const isDeleting = deletingId === cat.id;
                  
                  return (
                    <tr key={cat.id} className="hover:bg-apex-surface-lowest transition-colors group">
                      {/* Icon */}
                      <td className="py-3 px-6">
                        <SelectDropdown
                          value={cat.icon_name || "Package"}
                          onChange={(val) => {
                            handleUpdate(cat.id, 'icon_name', val);
                            handleSave(cat.id);
                          }}
                          options={AVAILABLE_ICONS.map(i => ({ label: i, value: i }))}
                          className="w-32"
                        />
                      </td>
                      
                      {/* Name */}
                      <td className="py-3 px-6">
                        <input 
                          type="text" 
                          value={cat.name}
                          onChange={(e) => handleUpdate(cat.id, 'name', e.target.value)}
                          onBlur={() => handleSave(cat.id)}
                          className="w-full bg-transparent border border-transparent hover:border-apex-outline-variant focus:border-apex-primary focus:bg-apex-surface rounded px-3 py-1.5 font-apex-sans font-medium text-sm text-apex-text focus:outline-none focus:ring-1 focus:ring-apex-primary/30 transition-all"
                          placeholder="Category Name"
                        />
                      </td>

                      {/* Slug */}
                      <td className="py-3 px-6">
                        <input 
                          type="text" 
                          value={cat.sku_prefix}
                          onChange={(e) => handleUpdate(cat.id, 'sku_prefix', e.target.value)}
                          onBlur={() => handleSave(cat.id)}
                          className="w-32 bg-transparent border border-transparent hover:border-apex-outline-variant focus:border-apex-primary focus:bg-apex-surface rounded px-3 py-1.5 font-apex-sans text-xs text-apex-on-surface-variant focus:outline-none focus:ring-1 focus:ring-apex-primary/30 uppercase transition-all"
                          placeholder="SLUG"
                          maxLength={5}
                        />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-6 text-center">
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            className="sr-only"
                            checked={cat.is_visible}
                            onChange={(e) => {
                              handleUpdate(cat.id, 'is_visible', e.target.checked);
                              handleSave(cat.id);
                            }}
                          />
                          <span className={`inline-block px-3 py-1 rounded-full font-apex-sans text-xs font-medium transition-colors ${
                            cat.is_visible 
                              ? 'bg-apex-tertiary-container text-apex-tertiary' 
                              : 'bg-apex-surface-low text-apex-on-surface-variant border border-apex-outline-variant'
                          }`}>
                            {cat.is_visible ? 'Active' : 'Hidden'}
                          </span>
                        </label>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-center">
                        {isDeleting ? (
                          <button 
                            onClick={(e) => { e.preventDefault(); handleDelete(cat.id); }}
                            disabled={loading}
                            className="bg-apex-error-container text-apex-error px-3 py-1.5 font-apex-sans text-xs font-medium rounded-lg"
                          >
                            Confirm?
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.preventDefault(); handleDelete(cat.id); }}
                            disabled={loading}
                            className="text-apex-on-surface-variant hover:text-apex-error hover:bg-apex-error/10 transition-colors px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium disabled:opacity-50 mx-auto"
                            title="Delete Registry"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Registry Footer Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center py-6 bg-apex-surface-lowest border-t border-apex-outline-variant">
            <div className="inline-flex items-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.05)] px-4 py-2.5 gap-3 border border-slate-50">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
              >
                <ArrowLeft size={20} strokeWidth={2.5} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-medium transition-all ${
                        currentPage === page 
                          ? 'bg-[#6F7A8B] text-white shadow-sm' 
                          : 'bg-[#F1F3F5] text-slate-700 hover:bg-[#E5E7EB]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="text-slate-400 px-1">...</span>;
                }
                return null;
              })}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
              >
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
