"use client";

import { useState, useEffect } from "react";
import { useSettings, CategoryConfig } from "@/components/SettingsProvider";
import { 
  Building2, Plus, Trash2, Save, Palette, Layers, Grid, Bookmark,
  Lightbulb, Bath, Sofa, Plug, Shirt, Package, Home, Wrench, Box, ShoppingCart, LayoutGrid, Check
} from "lucide-react";

const AVAILABLE_ICONS = [
  "Lightbulb", "Bath", "Sofa", "Plug", "Shirt", "Package", "Home", "Wrench", "Box", "ShoppingCart", "LayoutGrid"
];

const IconMap: Record<string, React.ElementType> = {
  Lightbulb, Bath, Sofa, Plug, Shirt, Package, Home, Wrench, Box, ShoppingCart, LayoutGrid
};

export default function SettingsDashboard() {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<"appearance" | "categories">("appearance");
  
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [theme, setTheme] = useState(settings.theme || "light");
  const [accentColor, setAccentColor] = useState(settings.accentColor || "#3b82f6");
  const [categories, setCategories] = useState<CategoryConfig[]>(settings.categories || []);
  const [loading, setLoading] = useState(false);

  // Sync state when settings are loaded from localStorage
  useEffect(() => {
    setCompanyName(settings.companyName);
    setTheme(settings.theme || "light");
    setAccentColor(settings.accentColor || "#3b82f6");
    setCategories(settings.categories || []);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    updateSettings({ 
      ...settings,
      companyName, 
      theme,
      accentColor,
      categories 
    });
    
    setLoading(false);
    alert("Settings saved successfully!");
  };

  const addCategory = () => {
    setCategories([
      ...categories,
      { id: Date.now().toString(), name: "New Category", iconName: "Package", skuPrefix: "NEW" }
    ]);
  };

  const updateCategory = (id: string, field: keyof CategoryConfig, value: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCategory = (id: string) => {
    if (confirm("Are you sure you want to remove this category?")) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-full pb-12 font-sans pt-12">
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">System Settings</h1>
            <p className="text-slate-500 text-sm mt-1">Manage appearance, categories, and system defaults.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-200/50 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab("appearance")}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'appearance' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Appearance
              </button>
              <button 
                onClick={() => setActiveTab("categories")}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'categories' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Categories & SKU
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-semibold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.1)] disabled:opacity-50 shrink-0"
            >
              <Save size={18} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "appearance" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Card */}
            <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col group block transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <Building2 size={24} strokeWidth={2} />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-semibold rounded-md">
                  <Bookmark size={12} /> Brand
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">IDENTITY</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">General Info</h3>
              
              <div className="space-y-4 mt-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Appearance Card */}
            <div className="bg-white border border-slate-100 rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col group block transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                  <Palette size={24} strokeWidth={2} />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-semibold rounded-md">
                  <Bookmark size={12} /> Theme
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">VISUALS</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Appearance</h3>
              
              <div className="space-y-5 mt-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Theme Preference</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium transition-colors"
                  >
                    <option value="light">Light Theme</option>
                    <option value="dark">Dark Theme</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Brand Accent Color</label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-200">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="absolute inset-[-10px] w-20 h-20 cursor-pointer"
                      />
                    </div>
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl text-sm font-mono uppercase font-medium focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-sm">Create catalog categories and define strict SKU prefixes for each. Products will automatically inherit these settings.</p>
              <button
                onClick={addCategory}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-xl transition-colors"
              >
                <Plus size={16} /> New Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((cat, idx) => {
                const IconComponent = IconMap[cat.iconName] || Package;
                
                return (
                  <div key={cat.id} className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col group transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative">
                    <button
                      onClick={() => removeCategory(cat.id)}
                      className="absolute top-6 right-6 p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-slate-50 text-slate-800 rounded-full flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                        <IconComponent size={24} strokeWidth={2} />
                      </div>
                      <div className="pt-1">
                        <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">CATEGORY {idx + 1}</p>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight truncate max-w-[200px]">
                          {cat.name || "Unnamed"}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mt-auto border-t border-slate-100 pt-5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category Name</label>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => updateCategory(cat.id, 'name', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="e.g. Lighting"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">SKU Prefix Format</label>
                        <input
                          type="text"
                          value={cat.skuPrefix}
                          onChange={(e) => updateCategory(cat.id, 'skuPrefix', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                          maxLength={6}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2.5 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-blue-500 uppercase transition-colors"
                          placeholder="e.g. LGT"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category Icon</label>
                        <div className="grid grid-cols-6 gap-2">
                          {AVAILABLE_ICONS.map(iconName => {
                            const CurrIcon = IconMap[iconName];
                            const isSelected = cat.iconName === iconName;
                            return (
                              <button
                                key={iconName}
                                onClick={() => updateCategory(cat.id, 'iconName', iconName)}
                                className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                                  isSelected 
                                    ? 'bg-slate-800 text-white shadow-md scale-105 ring-2 ring-slate-800 ring-offset-1' 
                                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                                }`}
                                title={iconName}
                              >
                                <CurrIcon size={18} strokeWidth={isSelected ? 2.5 : 1.5} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {categories.length === 0 && (
              <div className="text-center py-20 bg-white border border-slate-200 border-dashed rounded-[28px]">
                <Layers size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={1} />
                <p className="text-slate-500 font-medium">No categories configured.</p>
                <button onClick={addCategory} className="mt-4 text-blue-600 font-bold text-sm hover:underline">
                  + Add your first category
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
