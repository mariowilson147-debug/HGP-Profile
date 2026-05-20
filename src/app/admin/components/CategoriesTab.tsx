/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Bookmark, Plus, Trash2, Save, Package, LayoutGrid, Plug, Shirt, Home, Wrench, Box, ShoppingCart, Lightbulb, Bath, Sofa } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import { Category, addDbCategory, updateDbCategory, deleteDbCategory, syncCategoriesFromProducts, deleteEmptyCategories } from "@/lib/actions";

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
    if (!confirm("Are you sure you want to delete this category?")) return;
    setLoading(true);
    const { error } = await deleteDbCategory(id);
    if (!error) {
      const filtered = localCategories.filter(c => c.id !== id);
      setLocalCategories(filtered);
      updateSettings({ ...settings, categories: filtered });
    }
    setLoading(false);
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

  const handleCleanEmpty = async () => {
    if (!confirm("Are you sure you want to delete all categories that have zero products?")) return;
    setLoading(true);
    const { success, count, data, error } = await deleteEmptyCategories();
    if (error) {
      alert("Failed to clean empty categories: " + error);
    } else if (success && data) {
      setLocalCategories(data);
      updateSettings({ ...settings, categories: data });
      alert(count === 0 ? "No empty categories found." : `Successfully deleted ${count} empty categories!`);
    }
    setLoading(false);
  };

  const handleUpdate = (id: string, field: keyof Category, value: any) => {
    setLocalCategories(localCategories.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = async (id: string) => {
    setLoading(true);
    const cat = localCategories.find(c => c.id === id);
    if (cat) {
      await updateDbCategory(id, cat);
      updateSettings({ ...settings, categories: localCategories });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Category Management</h2>
        <p className="text-sm text-slate-500">Configure categories, SKU prefixes, and visibility.</p>
      </div>

      <div className="bg-white shadow-sm rounded border border-slate-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAdd}
              disabled={loading}
              className="flex items-center gap-2 bg-[#1f4e79] text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-[#183d5d] transition-colors disabled:opacity-50"
            >
              <Plus size={16} /> New Category
            </button>
            <button 
              onClick={handleSync}
              disabled={loading}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2.5 rounded text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Save size={16} /> Sync Existing
            </button>
          </div>
          
          <button 
            onClick={handleCleanEmpty}
            disabled={loading}
            className="flex items-center gap-2 text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} /> Clean Empty
          </button>
        </div>

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="px-6 py-4 text-[10px] uppercase font-semibold text-slate-400 tracking-wider w-16">Icon</th>
                <th className="px-6 py-4 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Display Name</th>
                <th className="px-6 py-4 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">URL Slug</th>
                <th className="px-6 py-4 text-[10px] uppercase font-semibold text-slate-400 tracking-wider text-center">Visibility</th>
                <th className="px-6 py-4 text-[10px] uppercase font-semibold text-slate-400 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localCategories.map(cat => {
                const CatIcon = IconMap[cat.icon_name || "Package"] || Package;
                return (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded border border-slate-200 flex items-center justify-center bg-slate-50 text-[#1f4e79] shrink-0 group-hover:border-[#1f4e79] group-hover:bg-blue-50 transition-colors relative">
                        <select
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          value={cat.icon_name || "Package"}
                          onChange={(e) => {
                            handleUpdate(cat.id, 'icon_name', e.target.value);
                            handleSave(cat.id);
                          }}
                        >
                          {AVAILABLE_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                        <CatIcon size={18} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="text" 
                        value={cat.name}
                        onChange={(e) => handleUpdate(cat.id, 'name', e.target.value)}
                        onBlur={() => handleSave(cat.id)}
                        className="w-full bg-transparent border-none font-semibold text-slate-800 text-sm focus:ring-0 focus:outline-none placeholder-slate-400 p-0"
                        placeholder="Category Name"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="text" 
                        value={cat.sku_prefix}
                        onChange={(e) => handleUpdate(cat.id, 'sku_prefix', e.target.value)}
                        onBlur={() => handleSave(cat.id)}
                        className="w-32 bg-transparent border-none text-slate-500 font-mono text-xs focus:ring-0 focus:outline-none uppercase p-0"
                        placeholder="SLUG"
                        maxLength={5}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                       <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={cat.is_visible}
                          onChange={(e) => {
                            handleUpdate(cat.id, 'is_visible', e.target.checked);
                            handleSave(cat.id);
                          }}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1f4e79]"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {localCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    No categories found. Sync existing from products or create a new one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
