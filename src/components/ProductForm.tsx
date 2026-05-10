"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product } from "./ProductModal";
import { addProduct, updateProduct } from "@/lib/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { UploadCloud, Save, ImageIcon } from "lucide-react";
import { useSettings } from "./SettingsProvider";

export default function ProductForm({ initialData }: { initialData?: Product }) {
  const router = useRouter();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || (settings.categories[0]?.name || "Lighting"),
    image_url: initialData?.image_url || "",
    buying_price: initialData?.buying_price || "",
    wholesale_price: initialData?.wholesale_price || "",
    retail_price: initialData?.retail_price || "",
    // Mock fields for UI fidelity
    sku: initialData ? `PRD-${initialData.id.substring(0, 8).toUpperCase()}` : "",
    description: "",
    stock: "42"
  });

  // Auto-update SKU prefix when category changes for new products
  useEffect(() => {
    if (!initialData) {
      const selectedCat = settings.categories.find(c => c.name === formData.category);
      if (selectedCat) {
        setFormData(prev => ({ ...prev, sku: `${selectedCat.skuPrefix}-0001` }));
      }
    }
  }, [formData.category, settings.categories, initialData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);

    let finalImageUrl = formData.image_url;

    try {
      if (imageFile) {
        const supabase = createSupabaseBrowserClient();
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `products/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) {
          throw new Error("Failed to upload image: " + uploadError.message);
        }

        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
      } else if (!finalImageUrl && !initialData) {
        throw new Error("Please upload a product image.");
      }

      const payload = {
        name: formData.name,
        category: formData.category,
        image_url: finalImageUrl,
        buying_price: Number(formData.buying_price),
        wholesale_price: Number(formData.wholesale_price),
        retail_price: Number(formData.retail_price),
      };

      let result;
      if (initialData) {
        result = await updateProduct(initialData.id, payload);
      } else {
        result = await addProduct(payload);
      }

      if (result && result.error) {
        throw new Error(result.error);
      }
      
      router.push("/admin");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to save product.");
      setLoading(false);
    }
  };

  const profitMargin = (formData.buying_price && formData.retail_price) 
    ? Math.round(((Number(formData.retail_price) - Number(formData.buying_price)) / Number(formData.retail_price)) * 100) 
    : 0;

  // --- Sub-components for Form Sections ---

  const BasicInfoCard = () => (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">Basic Information</h3>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Product Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors text-sm"
            placeholder="Enter full product name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">SKU</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors text-sm font-mono text-slate-600"
              placeholder="PRD-0000"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors text-sm"
            >
              {settings.categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
              {/* Fallback for old categories not in settings */}
              {!settings.categories.find(c => c.name === formData.category) && (
                <option value={formData.category}>{formData.category}</option>
              )}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={4}
            className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors text-sm"
            placeholder="Detailed product description..."
          />
        </div>
      </div>
    </div>
  );

  const PricingCard = ({ stacked = false }: { stacked?: boolean }) => (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">{isEdit ? 'Pricing' : 'Pricing Data'}</h3>
      </div>
      <div className={`p-5 ${stacked ? 'space-y-5' : 'grid grid-cols-1 md:grid-cols-3 gap-5'}`}>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cost Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-bold">KES</span>
            <input
              type="number" step="0.01" required
              value={formData.buying_price}
              onChange={(e) => setFormData({...formData, buying_price: e.target.value})}
              className="w-full bg-white border border-slate-300 text-slate-800 pl-10 pr-3 py-2 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors text-sm font-mono"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Wholesale Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-bold">KES</span>
            <input
              type="number" step="0.01" required
              value={formData.wholesale_price}
              onChange={(e) => setFormData({...formData, wholesale_price: e.target.value})}
              className="w-full bg-white border border-slate-300 text-slate-800 pl-10 pr-3 py-2 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors text-sm font-mono"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Retail Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-bold">KES</span>
            <input
              type="number" step="0.01" required
              value={formData.retail_price}
              onChange={(e) => setFormData({...formData, retail_price: e.target.value})}
              className="w-full bg-white border border-slate-300 text-slate-800 pl-10 pr-3 py-2 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors text-sm font-mono"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>
      
      {stacked && (
        <div className="mt-auto px-5 py-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Profit Margin (Retail)</span>
          <span className="font-semibold text-slate-800">{profitMargin}%</span>
        </div>
      )}
    </div>
  );

  const ProductMediaCard = ({ fullWidth = false }: { fullWidth?: boolean }) => (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm h-full flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">Product {fullWidth ? 'Images' : 'Media'}</h3>
      </div>
      <div className={`p-5 flex-1 flex ${fullWidth ? 'flex-col' : 'flex-col md:flex-row'} gap-5`}>
        
        {isEdit && !fullWidth && (
          <div className="w-full md:w-1/3 aspect-square bg-slate-50 border border-slate-200 rounded overflow-hidden flex items-center justify-center p-4">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url} alt="Current" className="max-w-full max-h-full object-contain mix-blend-multiply" />
          </div>
        )}

        <div className={`flex-1 border-2 border-dashed border-slate-300 rounded-sm bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center min-h-[200px] relative ${fullWidth ? 'py-16' : ''}`}>
           <input 
             type="file" 
             accept="image/*" 
             onChange={handleImageChange}
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
           />
           <div className="w-12 h-12 bg-[#E2E8F0] rounded-lg flex items-center justify-center text-[#64748B] mb-4">
             <UploadCloud size={24} />
           </div>
           <h4 className="text-sm font-semibold text-slate-800 mb-1">Drag and drop images here</h4>
           <p className="text-xs text-slate-500 mb-4">PNG, JPG, or WEBP. Max 5MB per file.</p>
           
           <button type="button" className="px-4 py-2 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 pointer-events-none">
             Browse Files
           </button>
        </div>
      </div>
    </div>
  );

  const InventoryCard = () => (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">Inventory Status</h3>
      </div>
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700">Product Status</label>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold tracking-wider rounded-full uppercase">
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span> Active
          </span>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Stock Quantity</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({...formData, stock: e.target.value})}
            className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors text-sm"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer mt-2">
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
          <span className="text-xs text-slate-600">Track inventory for this product</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            {isEdit ? initialData.name : "Add New Product"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEdit ? "Edit product details and pricing information." : "Create a new entry in the catalog system."}
          </p>
        </div>
        
        {/* Top Buttons for Edit Mode */}
        {isEdit && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-[#111827] text-white rounded text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {isEdit ? (
          // --- EDIT MODE: 2 Column Layout ---
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <BasicInfoCard />
              <ProductMediaCard />
            </div>
            <div className="flex flex-col gap-6">
              <PricingCard stacked />
              <InventoryCard />
            </div>
          </div>
        ) : (
          // --- ADD MODE: 1 Column Layout ---
          <div className="flex flex-col gap-6">
            <BasicInfoCard />
            <PricingCard />
            <ProductMediaCard fullWidth />
            
            {/* Bottom Buttons for Add Mode */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 mt-4">
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 bg-white rounded text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#111827] text-white rounded text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-70"
              >
                {loading ? "Creating..." : "Create Product"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

