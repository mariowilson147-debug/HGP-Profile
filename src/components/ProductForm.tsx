"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/actions";
import { addProducts, updateProduct } from "@/lib/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSettings } from "./SettingsProvider";
import {
  UploadCloud, Save, Plus, Trash2, CheckCircle2,
  AlertCircle, ArrowLeft, PackagePlus, Loader2
} from "lucide-react";
import imageCompression from 'browser-image-compression';

// ─── Types ───────────────────────────────────────────────────────────────────

type PriceFields = { buying_price: string; wholesale_price: string; retail_price: string };

interface QueueItem {
  id: string;
  name: string;
  category: string;
  imageFile: File | null;
  imagePreview: string;
  image_url: string;
  prices: PriceFields;
  visibility: 'visible' | 'hidden' | 'archived';
  availability: 'in_stock' | 'out_of_stock' | 'coming_soon';
  is_featured: boolean;
  tags: string;
  uploadProgress: number;   // 0–100
  status: "idle" | "uploading" | "done" | "error";
  errorMsg: string;
}

function blankItem(defaultCategory: string, id?: string): QueueItem {
  return {
    id: id ?? crypto.randomUUID(),
    name: "",
    category: defaultCategory,
    imageFile: null,
    imagePreview: "",
    image_url: "",
    prices: { buying_price: "", wholesale_price: "", retail_price: "" },
    visibility: 'visible',
    availability: 'in_stock',
    is_featured: false,
    tags: "",
    uploadProgress: 0,
    status: "idle",
    errorMsg: "",
  };
}

// ─── Toast ───────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";
interface Toast { id: string; msg: string; type: ToastType }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((msg: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, add };
}

// ─── Image Drop Zone ──────────────────────────────────────────────────────────

function ImageDropZone({
  item, onFile
}: {
  item: QueueItem;
  onFile: (file: File) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  const hasImage = item.imagePreview || item.image_url;

  return (
    <div
      className={`relative rounded border transition-all duration-200 overflow-hidden flex flex-col items-center justify-center min-h-[220px] cursor-pointer
        ${dragging ? "border-apex-primary bg-apex-primary/10" : "border-dashed border-apex-outline-variant/30 bg-[#060e20] hover:border-apex-primary/50 hover:bg-[#060e20]/80"}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />

      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imagePreview || item.image_url}
            alt="preview"
            className="w-full h-full object-cover max-h-[260px]"
          />
          <div className="absolute inset-0 bg-[#0b1326]/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
            <span className="text-apex-primary border border-apex-primary bg-apex-primary/10 font-apex-mono text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded shadow-[0_0_10px_rgba(192,193,255,0.2)]">
              REPLACE VISUAL ASSET
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 p-6 text-center select-none">
          <UploadCloud size={32} className={`transition-colors ${dragging ? "text-apex-primary" : "text-apex-outline-variant/50"}`} />
          <div>
            <p className="text-[11px] font-bold text-apex-text uppercase tracking-widest font-apex-mono">DROP VISUAL ASSET HERE</p>
            <p className="text-[9px] text-apex-on-surface-variant/50 font-apex-mono mt-1 uppercase tracking-widest">OR CLICK TO BROWSE LOCAL STORAGE</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {item.status === "uploading" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0b1326]">
          <div
            className="h-full bg-apex-primary transition-all duration-300 shadow-[0_0_8px_rgba(192,193,255,0.8)]"
            style={{ width: `${item.uploadProgress}%` }}
          />
        </div>
      )}

      {/* Status badge */}
      {item.status === "done" && (
        <div className="absolute top-2 right-2 bg-apex-secondary/20 text-apex-secondary border border-apex-secondary rounded-sm p-1 shadow-[0_0_8px_rgba(76,215,246,0.3)]">
          <CheckCircle2 size={12} />
        </div>
      )}
      {item.status === "error" && (
        <div className="absolute top-2 right-2 bg-apex-error/20 text-apex-error border border-apex-error rounded-sm p-1 shadow-[0_0_8px_rgba(255,180,171,0.3)]">
          <AlertCircle size={12} />
        </div>
      )}
    </div>
  );
}

// ─── Single Queue Card ────────────────────────────────────────────────────────

function QueueCard({
  item, index, total, categories, onChange, onRemove
}: {
  item: QueueItem;
  index: number;
  total: number;
  categories: { id: string; name: string }[];
  onChange: (id: string, patch: Partial<QueueItem>) => void;
  onRemove: (id: string) => void;
}) {
  const margin = item.prices.buying_price && item.prices.retail_price
    ? Math.round(((+item.prices.retail_price - +item.prices.buying_price) / +item.prices.retail_price) * 100)
    : null;

  return (
    <div className={`bg-[#131b2e] rounded border transition-all duration-200 apex-glass-panel relative overflow-hidden
      ${item.status === "done" ? "border-apex-secondary/30" : item.status === "error" ? "border-apex-error/30" : "border-apex-outline-variant/20"}`}>
      
      {item.status === "done" && <div className="absolute top-0 left-0 w-1 h-full bg-apex-secondary"></div>}
      {item.status === "error" && <div className="absolute top-0 left-0 w-1 h-full bg-apex-error"></div>}

      {/* Card header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-apex-outline-variant/20 bg-apex-surface-low">
        <div className="flex items-center gap-3">
          {item.status === "uploading" && <Loader2 size={14} className="animate-spin text-apex-primary" />}
          {item.status === "done" && <CheckCircle2 size={14} className="text-apex-secondary" />}
          {item.status === "error" && <AlertCircle size={14} className="text-apex-error" />}
          <span className="text-[10px] font-bold text-apex-primary uppercase tracking-widest font-apex-mono">
            ENTRY_NODE_0{index + 1}
          </span>
          {item.name && <span className="text-xs text-apex-on-surface-variant font-apex-mono tracking-wider truncate max-w-[200px]">{"//"} {item.name}</span>}
        </div>
        {total > 1 && (
          <button onClick={() => onRemove(item.id)} className="p-1.5 rounded bg-apex-error/10 border border-apex-error/30 text-apex-error hover:bg-apex-error/20 transition-colors shadow-[0_0_10px_rgba(255,180,171,0.1)]">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Image */}
        <div className="lg:col-span-4">
          <label className="block text-[10px] font-bold text-apex-on-surface-variant/60 uppercase tracking-widest font-apex-mono mb-2">VISUAL ASSET</label>
          <ImageDropZone item={item} onFile={file => {
            const preview = URL.createObjectURL(file);
            onChange(item.id, { imageFile: file, imagePreview: preview, status: "idle", errorMsg: "" });
          }} />
        </div>

        {/* Right: Fields */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-apex-on-surface-variant/60 uppercase tracking-widest font-apex-mono mb-2">IDENTIFIER_STRING *</label>
              <input
                type="text"
                value={item.name}
                onChange={e => onChange(item.id, { name: e.target.value })}
                className="w-full bg-[#060e20] border border-apex-outline-variant/30 rounded px-4 py-2.5 text-xs text-apex-text font-apex-mono tracking-wider focus:outline-none focus:border-apex-primary/50 focus:ring-1 focus:ring-apex-primary/30 transition-all placeholder:text-apex-on-surface-variant/30"
                placeholder="PRODUCT_NAME_01"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-apex-on-surface-variant/60 uppercase tracking-widest font-apex-mono mb-2">CORE_CATEGORY</label>
              <select
                value={item.category}
                onChange={e => onChange(item.id, { category: e.target.value })}
                className="w-full bg-[#060e20] border border-apex-outline-variant/30 rounded px-4 py-2.5 text-xs text-apex-text font-apex-mono tracking-wider focus:outline-none focus:border-apex-primary/50 focus:ring-1 focus:ring-apex-primary/30 transition-all"
              >
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Prices */}
          <div>
            <label className="block text-[10px] font-bold text-apex-secondary uppercase tracking-widest font-apex-mono mb-3 pt-2 border-t border-apex-outline-variant/10">FINANCIAL METRICS</label>
            <div className="grid grid-cols-3 gap-4">
              {(["buying_price", "wholesale_price", "retail_price"] as const).map((field, i) => (
                <div key={field}>
                  <label className="block text-[9px] font-bold text-apex-on-surface-variant/50 uppercase tracking-widest font-apex-mono mb-1.5">
                    {["COST_VAL", "WHOLESALE_VAL", "RETAIL_VAL"][i]}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-apex-on-surface-variant/40 font-apex-mono">KES</span>
                    <input
                      type="number" step="0.01" min="0"
                      value={item.prices[field]}
                      onChange={e => onChange(item.id, { prices: { ...item.prices, [field]: e.target.value } })}
                      className="w-full bg-[#060e20] border border-apex-outline-variant/30 rounded pl-9 pr-3 py-2.5 text-xs font-apex-mono text-apex-text focus:outline-none focus:border-apex-secondary/50 focus:ring-1 focus:ring-apex-secondary/30 transition-all placeholder:text-apex-on-surface-variant/20"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 pt-3 border-t border-apex-outline-variant/10">
            <div>
              <label className="block text-[10px] font-bold text-apex-on-surface-variant/60 uppercase tracking-widest font-apex-mono mb-2">SYSTEM_VISIBILITY</label>
              <select
                value={item.visibility}
                onChange={e => onChange(item.id, { visibility: e.target.value as 'visible' | 'hidden' | 'archived' })}
                className="w-full bg-[#060e20] border border-apex-outline-variant/30 rounded px-4 py-2.5 text-xs text-apex-text font-apex-mono tracking-wider focus:outline-none focus:border-apex-primary/50 focus:ring-1 focus:ring-apex-primary/30 transition-all"
              >
                <option value="visible">PUBLIC_VISIBLE</option>
                <option value="hidden">ADMIN_ONLY</option>
                <option value="archived">ARCHIVED_DISABLED</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-apex-on-surface-variant/60 uppercase tracking-widest font-apex-mono mb-2">INVENTORY_STATUS</label>
              <select
                value={item.availability}
                onChange={e => onChange(item.id, { availability: e.target.value as 'in_stock' | 'out_of_stock' | 'coming_soon' })}
                className="w-full bg-[#060e20] border border-apex-outline-variant/30 rounded px-4 py-2.5 text-xs text-apex-text font-apex-mono tracking-wider focus:outline-none focus:border-apex-primary/50 focus:ring-1 focus:ring-apex-primary/30 transition-all"
              >
                <option value="in_stock">IN_STOCK</option>
                <option value="out_of_stock">DEPLETED</option>
                <option value="coming_soon">INBOUND</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-apex-on-surface-variant/60 uppercase tracking-widest font-apex-mono mb-2">METADATA_TAGS [CSV]</label>
              <input
                type="text"
                value={item.tags}
                onChange={e => onChange(item.id, { tags: e.target.value })}
                className="w-full bg-[#060e20] border border-apex-outline-variant/30 rounded px-4 py-2.5 text-xs text-apex-text font-apex-mono tracking-wider focus:outline-none focus:border-apex-primary/50 focus:ring-1 focus:ring-apex-primary/30 transition-all placeholder:text-apex-on-surface-variant/30"
                placeholder="PROMO, NEW_ARRIVAL, CLEARANCE"
              />
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox"
                    checked={item.is_featured}
                    onChange={e => onChange(item.id, { is_featured: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 bg-[#060e20] border border-apex-outline-variant/30 rounded-full transition-colors ${item.is_featured ? 'bg-apex-secondary/20 border-apex-secondary/50' : ''}`}></div>
                  <div className={`absolute left-1 top-1 w-3 h-3 bg-apex-on-surface-variant/50 rounded-full transition-transform duration-200 ${item.is_featured ? 'translate-x-5 bg-apex-secondary shadow-[0_0_8px_rgba(76,215,246,0.8)]' : ''}`}></div>
                </div>
                <span className="text-[10px] font-bold text-apex-text uppercase tracking-widest font-apex-mono group-hover:text-apex-secondary transition-colors">
                  MARK_AS_FEATURED_ASSET
                </span>
              </label>

              {margin !== null && (
                <div className="flex items-center gap-3 text-[10px] bg-[#060e20] border border-apex-outline-variant/20 rounded px-3 py-1.5 font-apex-mono tracking-widest uppercase">
                  <span className="text-apex-on-surface-variant/60">PROFIT_MARGIN</span>
                  <span className={`font-bold ${margin >= 20 ? "text-apex-secondary shadow-[0_0_10px_rgba(76,215,246,0.1)]" : margin >= 10 ? "text-amber-500" : "text-apex-error shadow-[0_0_10px_rgba(255,180,171,0.1)]"}`}>
                    {margin}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {item.errorMsg && (
            <div className="mt-2 text-[10px] text-apex-error bg-apex-error/10 border border-apex-error/30 rounded px-3 py-2 flex items-center gap-2 font-apex-mono tracking-widest uppercase">
              <AlertCircle size={14} /> [ERROR]: {item.errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductForm({ initialData }: { initialData?: Product }) {
  const router = useRouter();
  const { settings } = useSettings();
  const { toasts, add: addToast } = useToast();

  const defaultCategory = settings.categories[0]?.name || "General";
  const isEdit = !!initialData;

  // Edit mode single-item state
  const [editItem, setEditItem] = useState<QueueItem>(() => {
    if (!initialData) return blankItem(defaultCategory);
    return {
      id: initialData.id,
      name: initialData.name,
      category: initialData.category,
      imageFile: null,
      imagePreview: "",
      image_url: initialData.image_url,
      prices: {
        buying_price: String(initialData.buying_price),
        wholesale_price: String(initialData.wholesale_price),
        retail_price: String(initialData.retail_price),
      },
      visibility: initialData.visibility || 'visible',
      availability: initialData.availability || 'in_stock',
      is_featured: initialData.is_featured || false,
      tags: initialData.tags ? initialData.tags.join(", ") : "",
      uploadProgress: 0,
      status: "idle",
      errorMsg: "",
    };
  });

  // Add mode: queue of items
  const [queue, setQueue] = useState<QueueItem[]>([blankItem(defaultCategory)]);
  const [submitting, setSubmitting] = useState(false);

  const updateQueue = (id: string, patch: Partial<QueueItem>) =>
    setQueue(q => q.map(it => it.id === id ? { ...it, ...patch } : it));

  const addToQueue = () => setQueue(q => [...q, blankItem(defaultCategory)]);
  const removeFromQueue = (id: string) => setQueue(q => q.filter(it => it.id !== id));

  // Upload image for a single item, with fake progress simulation
  const uploadImage = async (item: QueueItem): Promise<string> => {
    if (!item.imageFile) return item.image_url;

    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: 'image/webp'
    };
    
    let fileToUpload = item.imageFile;
    let ext = fileToUpload.name.split(".").pop() || 'webp';
    
    try {
      fileToUpload = await imageCompression(item.imageFile, options);
      ext = 'webp'; 
    } catch (error) {
      console.error("Image compression failed, uploading original:", error);
    }

    const supabase = createSupabaseBrowserClient();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    let prog = 10;
    const ticker = setInterval(() => {
      prog = Math.min(prog + 15, 85);
      if (isEdit) setEditItem(p => ({ ...p, uploadProgress: prog, status: "uploading" }));
      else updateQueue(item.id, { uploadProgress: prog, status: "uploading" });
    }, 200);

    const { error } = await supabase.storage.from("images").upload(path, fileToUpload, { upsert: true });
    clearInterval(ticker);

    if (error) throw new Error("Image upload failed: " + error.message);

    const { data } = supabase.storage.from("images").getPublicUrl(path);

    if (isEdit) setEditItem(p => ({ ...p, uploadProgress: 100, status: "done" }));
    else updateQueue(item.id, { uploadProgress: 100, status: "done" });

    return data.publicUrl;
  };

  // ── Edit mode submit ──
  const handleEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editItem.name.trim()) { addToast("IDENTIFIER_STRING is required.", "error"); return; }
    if (!editItem.imageFile && !editItem.image_url) { addToast("VISUAL_ASSET is required.", "error"); return; }
    setSubmitting(true);
    try {
      const imageUrl = await uploadImage(editItem);
      const result = await updateProduct(initialData!.id, {
        name: editItem.name,
        category: editItem.category.trim(),
        image_url: imageUrl,
        buying_price: +editItem.prices.buying_price,
        wholesale_price: +editItem.prices.wholesale_price,
        retail_price: +editItem.prices.retail_price,
        visibility: editItem.visibility,
        availability: editItem.availability,
        is_featured: editItem.is_featured,
        tags: editItem.tags.split(',').map(t => t.trim()).filter(Boolean),
        sort_order: initialData!.sort_order || 0,
        attributes: initialData!.attributes || {},
      });
      if (result?.error) throw new Error(result.error);
      addToast("REGISTRY UPDATED SUCCESSFULLY", "success");
      setTimeout(() => router.push("/admin/products"), 1200);
    } catch (err) {
      setEditItem(p => ({ ...p, status: "error", errorMsg: err instanceof Error ? err.message : "Unknown error" }));
      addToast(err instanceof Error ? err.message : "UPDATE_FAILED", "error");
      setSubmitting(false);
    }
  };

  // ── Bulk add submit ──
  const handleBulkSubmit = async () => {
    for (const item of queue) {
      if (!item.name.trim()) { addToast(`ENTRY_NODE_0${queue.indexOf(item) + 1}: IDENTIFIER_STRING is required.`, "error"); return; }
      if (!item.imageFile && !item.image_url) { addToast(`ENTRY_NODE_0${queue.indexOf(item) + 1}: VISUAL_ASSET is required.`, "error"); return; }
    }
    setSubmitting(true);

    const finalUrls: Record<string, string> = {};
    for (const item of queue) {
      try {
        updateQueue(item.id, { status: "uploading", uploadProgress: 5 });
        finalUrls[item.id] = await uploadImage(item);
        updateQueue(item.id, { status: "done", uploadProgress: 100 });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        updateQueue(item.id, { status: "error", errorMsg: msg });
        addToast(`ASSET_UPLOAD_FAILED // "${item.name}".`, "error");
        setSubmitting(false);
        return;
      }
    }

    const payload = queue.map((item, idx) => ({
      name: item.name,
      category: item.category.trim(),
      image_url: finalUrls[item.id],
      buying_price: +item.prices.buying_price,
      wholesale_price: +item.prices.wholesale_price,
      retail_price: +item.prices.retail_price,
      visibility: item.visibility,
      availability: item.availability,
      is_featured: item.is_featured,
      tags: item.tags.split(',').map(t => t.trim()).filter(Boolean),
      attributes: {},
      sort_order: idx,
    }));

    try {
      const result = await addProducts(payload);
      if (result?.error) throw new Error(result.error);
      addToast(`[SUCCESS] ${result.count} REGISTR${result.count === 1 ? "Y" : "IES"} INITIALIZED`, "success");
      setTimeout(() => router.push("/admin/products"), 1500);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "REGISTRY_INITIALIZATION_FAILED", "error");
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-screen bg-transparent font-apex-sans">

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-5 py-3 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)] font-apex-mono text-[10px] font-bold tracking-widest uppercase border backdrop-blur pointer-events-auto animate-fade-in
            ${t.type === "success" ? "bg-apex-secondary/10 border-apex-secondary/50 text-apex-secondary" : t.type === "error" ? "bg-apex-error/10 border-apex-error/50 text-apex-error" : "bg-apex-surface-highest/80 border-apex-outline-variant/30 text-apex-text"}`}>
            {t.type === "success" && <CheckCircle2 size={16} />}
            {t.type === "error" && <AlertCircle size={16} />}
            {t.msg}
          </div>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto py-8 px-8 select-none">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-4 border-b border-apex-outline-variant/20">
          <div>
            <button
              onClick={() => router.push("/admin/products")}
              className="flex items-center gap-1.5 text-apex-on-surface-variant hover:text-apex-secondary text-[10px] font-apex-mono font-bold uppercase tracking-widest mb-4 transition-colors w-fit"
            >
              <ArrowLeft size={14} /> ABORT TO DIRECTORY
            </button>
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-apex-primary"></div>
              <h1 className="text-3xl font-black text-apex-text tracking-tight uppercase">
                {isEdit ? `EDIT REGISTRY: ${initialData.name}` : "REGISTRY: ADD PRODUCTS"}
              </h1>
            </div>
            <p className="font-apex-mono text-[10px] text-apex-secondary mt-2 tracking-widest uppercase">
              {isEdit ? "DATABASE_OPERATION: UPDATE_RECORD" : "DATABASE_OPERATION: INSERT_RECORDS"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!isEdit && (
              <button
                onClick={addToQueue}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#131b2e] border border-apex-outline-variant/30 text-apex-on-surface-variant hover:text-apex-text rounded text-[11px] font-apex-sans font-bold tracking-widest uppercase transition-colors disabled:opacity-50"
              >
                <Plus size={14} /> NEW ENTRY
              </button>
            )}
            <button
              onClick={isEdit ? handleEditSubmit : handleBulkSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-apex-primary text-[#0b1326] rounded text-[11px] font-apex-sans font-bold tracking-widest uppercase hover:brightness-110 transition-all shadow-[0_0_15px_rgba(192,193,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : isEdit ? <Save size={14} /> : <PackagePlus size={14} />}
              {submitting ? "UPLOADING..." : isEdit ? "COMMIT UPDATE" : "INITIALIZE REGISTRIES"}
            </button>
          </div>
        </div>

        {/* Queue / Edit cards */}
        <div className="flex flex-col gap-8">
          {isEdit ? (
            <QueueCard
              item={editItem}
              index={0}
              total={1}
              categories={settings.categories}
              onChange={(_, patch) => setEditItem(p => ({ ...p, ...patch }))}
              onRemove={() => {}}
            />
          ) : (
            queue.map((item, i) => (
              <QueueCard
                key={item.id}
                item={item}
                index={i}
                total={queue.length}
                categories={settings.categories}
                onChange={updateQueue}
                onRemove={removeFromQueue}
              />
            ))
          )}
        </div>

        {/* Bottom Add / Submit bar (add mode) */}
        {!isEdit && (
          <div className="mt-8 pt-4 border-t border-apex-outline-variant/20 flex items-center justify-between">
            <button
              onClick={addToQueue}
              disabled={submitting}
              className="flex items-center gap-2 text-[10px] text-apex-primary font-bold hover:text-apex-secondary transition-colors disabled:opacity-50 tracking-widest font-apex-mono uppercase"
            >
              <Plus size={14} /> APPEND NEW ENTRY TO QUEUE
            </button>
            <p className="text-[10px] font-apex-mono tracking-widest uppercase text-apex-on-surface-variant/50">
              QUEUE_SIZE: {queue.length} BLOCK{queue.length !== 1 ? "S" : ""}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
        .animate-fade-in { animation: fade-in 0.25s ease both; }
      `}</style>
    </div>
  );
}
