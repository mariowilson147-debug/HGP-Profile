/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Bookmark, Plus, Trash2, Save, Package, LayoutGrid, Plug, Shirt, Home, Wrench, Box, ShoppingCart, Lightbulb, Bath, Sofa, MoreVertical, Filter, CloudLightning } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    <div className="w-full space-y-8 animate-in fade-in duration-500 font-apex-sans max-w-[1400px] mx-auto pt-6 px-2 select-none">
      
      {/* Header Section */}
      <div className="flex justify-between items-start pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-apex-secondary"></div>
            <h2 className="font-apex-sans text-3xl font-black text-apex-text uppercase tracking-tight">REGISTRY: CATEGORIES</h2>
          </div>
          <p className="font-apex-mono text-[10px] text-apex-secondary mt-2 tracking-widest uppercase">
            ARCHIVE_QUERY: [FILTER=CATALOGUE_ALL] | RECORDS_TOTAL: {localCategories.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 bg-[#131b2e] border border-apex-outline-variant/30 text-apex-on-surface-variant hover:text-apex-text px-4 py-2.5 font-apex-sans font-bold text-[11px] tracking-wider uppercase transition-colors rounded disabled:opacity-50"
          >
            <CloudLightning size={14} /> Sync Core
          </button>
          <button className="flex items-center gap-2 bg-[#131b2e] border border-apex-outline-variant/30 text-apex-on-surface-variant hover:text-apex-text px-4 py-2.5 font-apex-sans font-bold text-[11px] tracking-wider uppercase transition-colors rounded">
            <Filter size={14} /> Refine View
          </button>
          <button 
            onClick={handleAdd}
            disabled={loading}
            className="bg-apex-text hover:bg-white text-[#0b1326] font-apex-sans font-bold text-[11px] tracking-widest uppercase px-5 py-2.5 rounded shadow-[0_0_15px_rgba(218,226,253,0.3)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus size={14} /> Initialize New Category
          </button>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-[#131b2e] border border-apex-outline-variant/20 rounded flex flex-col relative overflow-hidden">
        
        {/* Table Canvas */}
        <div className="overflow-x-auto min-h-64">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#171f33]/80 border-b border-apex-outline-variant/20 font-apex-sans font-bold text-[10px] text-apex-on-surface-variant/80 uppercase tracking-widest">
                <th className="py-4 px-6 font-bold w-24">CAT_VISUAL</th>
                <th className="py-4 px-6 font-bold">IDENTIFIER_STRING</th>
                <th className="py-4 px-6 font-bold">CORE_PREFIX_SLUG</th>
                <th className="py-4 px-6 font-bold text-center">STATUS</th>
                <th className="py-4 px-6 font-bold text-center">PROTOCOL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apex-outline-variant/10 text-apex-text">
              {localCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center flex-col items-center justify-center text-apex-on-surface-variant/40 font-apex-mono">
                    <LayoutGrid size={48} className="mb-4 text-apex-outline/20 mx-auto" strokeWidth={1} />
                    <p className="font-bold text-xs uppercase tracking-widest">NO CATEGORY REGISTRIES DETECTED</p>
                  </td>
                </tr>
              ) : (
                localCategories.map((cat) => {
                  const CatIcon = IconMap[cat.icon_name || "Package"] || Package;
                  const isDeleting = deletingId === cat.id;
                  
                  return (
                    <tr key={cat.id} className="hover:bg-[#171f33]/40 transition-colors group">
                      {/* CAT_VISUAL */}
                      <td className="py-3 px-6">
                        <div className="w-16 h-10 bg-[#060e20] border border-apex-outline-variant/30 flex items-center justify-center shrink-0 group-hover:border-apex-secondary/50 transition-colors relative overflow-hidden text-apex-secondary/80 group-hover:text-apex-secondary group-hover:bg-apex-secondary/10">
                          <select
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            value={cat.icon_name || "Package"}
                            onChange={(e) => {
                              handleUpdate(cat.id, 'icon_name', e.target.value);
                              handleSave(cat.id);
                            }}
                          >
                            {AVAILABLE_ICONS.map(i => <option key={i} className="bg-apex-surface text-apex-text" value={i}>{i}</option>)}
                          </select>
                          <CatIcon size={20} className={cat.is_visible ? "apex-glow-accent" : ""} />
                        </div>
                      </td>
                      
                      {/* IDENTIFIER_STRING */}
                      <td className="py-3 px-6">
                        <input 
                          type="text" 
                          value={cat.name}
                          onChange={(e) => handleUpdate(cat.id, 'name', e.target.value)}
                          onBlur={() => handleSave(cat.id)}
                          className="w-full bg-transparent border-none font-apex-sans font-bold text-sm tracking-wide text-apex-text focus:ring-0 focus:outline-none placeholder-apex-on-surface-variant/30 p-0"
                          placeholder="CATEGORY_NAME"
                        />
                        <p className="font-apex-mono text-[9px] text-apex-secondary tracking-widest uppercase mt-0.5">SUBCAT_COUNT_0</p>
                      </td>

                      {/* CORE_PREFIX_SLUG */}
                      <td className="py-3 px-6">
                        <input 
                          type="text" 
                          value={cat.sku_prefix}
                          onChange={(e) => handleUpdate(cat.id, 'sku_prefix', e.target.value)}
                          onBlur={() => handleSave(cat.id)}
                          className="w-32 bg-transparent border-none text-apex-on-surface-variant font-apex-mono text-xs focus:ring-0 focus:outline-none uppercase p-0 tracking-wider"
                          placeholder="SLUG"
                          maxLength={5}
                        />
                      </td>

                      {/* STATUS */}
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
                          <span className={`inline-block px-3 py-1 border font-apex-mono text-[9px] font-bold tracking-widest uppercase transition-colors ${
                            cat.is_visible 
                              ? 'border-apex-secondary/50 bg-apex-secondary/10 text-apex-secondary shadow-[0_0_10px_rgba(76,215,246,0.1)]' 
                              : 'border-apex-outline-variant/30 bg-[#060e20] text-apex-on-surface-variant'
                          }`}>
                            {cat.is_visible ? 'ACTIVE' : 'IDLE'}
                          </span>
                        </label>
                      </td>

                      {/* PROTOCOL */}
                      <td className="py-3 px-6 text-center">
                        {isDeleting ? (
                          <button 
                            onClick={(e) => { e.preventDefault(); handleDelete(cat.id); }}
                            disabled={loading}
                            className="bg-apex-error/20 text-apex-error border border-apex-error/50 px-2 py-1 font-apex-mono text-[9px] font-bold uppercase rounded tracking-widest shadow-[0_0_10px_rgba(255,180,171,0.2)] animate-pulse"
                          >
                            CONFIRM
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.preventDefault(); handleDelete(cat.id); }}
                            disabled={loading}
                            className="text-apex-on-surface-variant/50 hover:text-apex-error transition-colors p-2 disabled:opacity-50"
                            title="Delete Registry"
                          >
                            <MoreVertical size={16} />
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
        <div className="px-6 py-4 bg-[#0b1326] border-t border-apex-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-apex-mono text-[10px] text-apex-on-surface-variant/70 tracking-widest uppercase">
          <div className="flex items-center gap-4">
            <span>SHOWING ENTRY 001-{(localCategories.length < 10 ? localCategories.length : '010')} OF {localCategories.length}</span>
            <div className="w-24 h-1 bg-[#171f33] rounded-full overflow-hidden flex">
              <div className="w-full h-full bg-apex-secondary"></div>
            </div>
          </div>
          <div className="flex gap-1.5 text-xs text-apex-text select-none">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-[#2d3449] bg-[#131b2e] hover:bg-[#171f33] cursor-pointer transition-colors">&lt;</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-apex-secondary bg-[#131b2e] text-apex-secondary font-bold">01</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-[#2d3449] bg-[#131b2e] hover:bg-[#171f33] cursor-pointer transition-colors opacity-50 cursor-not-allowed">02</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-[#2d3449] bg-[#131b2e] hover:bg-[#171f33] cursor-pointer transition-colors opacity-50 cursor-not-allowed">&gt;</button>
          </div>
        </div>

      </div>

    </div>
  );
}
