"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "./ProductModal";
import { addProduct, updateProduct } from "@/lib/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ProductForm({ initialData }: { initialData?: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "Lighting",
    image_url: initialData?.image_url || "",
    buying_price: initialData?.buying_price || "",
    wholesale_price: initialData?.wholesale_price || "",
    retail_price: initialData?.retail_price || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (initialData) {
        await updateProduct(initialData.id, payload);
      } else {
        await addProduct(payload);
      }
      router.push("/admin");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to save product.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-[#0a0a0a] border border-[#222] p-8 md:p-12 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">Product Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] px-4 py-3.5 rounded-sm focus:outline-none focus:border-[#d4af37] font-light transition-colors"
              placeholder="e.g. Aurelia Chandelier"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] px-4 py-3.5 rounded-sm focus:outline-none focus:border-[#d4af37] font-light transition-colors"
            >
              <option value="Lighting">Lighting Catalog</option>
              <option value="Electronics">Electronics & Accessories</option>
              <option value="Bathroom">Bathroom Ware</option>
              <option value="Interior">Interior Décor</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">Product Image (High Quality)</label>
            <input
              type="file"
              accept="image/*"
              required={!formData.image_url}
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full bg-[#111] border border-[#333] text-[#888] px-4 py-3 rounded-sm file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-[#1a1a1a] file:text-[#d4af37] hover:file:bg-[#222] transition-colors"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">Buying Price (KES)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-xs font-medium">KES</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.buying_price}
                  onChange={(e) => setFormData({...formData, buying_price: e.target.value})}
                  className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] pl-14 pr-4 py-3.5 rounded-sm focus:outline-none focus:border-[#d4af37] font-light transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">Wholesale Price (KES)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-xs font-medium">KES</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.wholesale_price}
                  onChange={(e) => setFormData({...formData, wholesale_price: e.target.value})}
                  className="w-full bg-[#111] border border-[#333] text-[#d4af37] pl-14 pr-4 py-3.5 rounded-sm focus:outline-none focus:border-[#d4af37] font-light transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">Retail Price (KES)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-xs font-medium">KES</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.retail_price}
                  onChange={(e) => setFormData({...formData, retail_price: e.target.value})}
                  className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] pl-14 pr-4 py-3.5 rounded-sm focus:outline-none focus:border-[#d4af37] font-light transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {formData.buying_price && formData.wholesale_price && formData.retail_price && (
            <div className="mt-6 p-6 bg-[#111] border border-[#333] rounded-sm grid grid-cols-2 gap-4 shadow-inner">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#888] mb-2">Wholesale Margin</div>
                <div className="text-2xl text-[#d4af37] font-serif">{Math.round(((Number(formData.wholesale_price) - Number(formData.buying_price)) / Number(formData.buying_price)) * 100)}%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#888] mb-2">Retail Margin</div>
                <div className="text-2xl text-[#d4af37] font-serif">{Math.round(((Number(formData.retail_price) - Number(formData.buying_price)) / Number(formData.buying_price)) * 100)}%</div>
              </div>
            </div>
          )}

          {(imageFile || formData.image_url) && (
            <div className="mt-8">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">Image Preview</label>
              <div className="w-full aspect-[4/3] bg-[#111] border border-[#333] rounded-sm overflow-hidden flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url} alt="Preview" className="max-w-full max-h-full object-contain drop-shadow-xl" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = 'block')} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 pt-10 border-t border-[#222]">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="px-8 py-4 bg-[#111] text-[#888] border border-[#333] font-medium uppercase tracking-widest text-xs rounded-sm hover:text-[#e0e0e0] hover:border-[#666] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-4 bg-gradient-to-r from-[#b39129] to-[#d4af37] text-[#0f0f0f] font-medium uppercase tracking-[0.2em] text-xs rounded-sm hover:from-[#d4af37] hover:to-[#ebd483] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
        >
          {loading ? "Saving..." : initialData ? "Save Changes" : "Publish Premium Product"}
        </button>
      </div>
    </form>
  );
}
