"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Product } from "./ProductModal";
import { addProducts, updateProduct } from "@/lib/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSettings } from "./SettingsProvider";
import {
  UploadCloud, Save, Plus, Trash2, CheckCircle2,
  AlertCircle, X, ImageIcon, ArrowLeft, PackagePlus, Loader2
} from "lucide-react";

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
      className={`relative rounded-xl border-2 transition-all duration-200 overflow-hidden flex flex-col items-center justify-center min-h-[160px] cursor-pointer
        ${dragging ? "border-blue-400 bg-blue-50 scale-[1.01]" : "border-dashed border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40"}`}
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
            className="w-full h-full object-cover max-h-[200px]"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-full">Change Image</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 p-6 text-center select-none">
          <UploadCloud size={28} className={`transition-colors ${dragging ? "text-blue-500" : "text-slate-400"}`} />
          <p className="text-sm font-semibold text-slate-600">Drop image here</p>
          <p className="text-xs text-slate-400">or click to browse</p>
        </div>
      )}

      {/* Progress bar */}
      {item.status === "uploading" && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${item.uploadProgress}%` }}
          />
        </div>
      )}

      {/* Status badge */}
      {item.status === "done" && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-0.5">
          <CheckCircle2 size={14} />
        </div>
      )}
      {item.status === "error" && (
        <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-0.5">
          <AlertCircle size={14} />
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
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200
      ${item.status === "done" ? "border-green-200 bg-green-50/30" : item.status === "error" ? "border-red-200" : "border-slate-200"}`}>

      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          {item.status === "uploading" && <Loader2 size={14} className="animate-spin text-blue-500" />}
          {item.status === "done" && <CheckCircle2 size={14} className="text-green-500" />}
          {item.status === "error" && <AlertCircle size={14} className="text-red-500" />}
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item {index + 1}</span>
          {item.name && <span className="text-xs text-slate-700 font-semibold truncate max-w-[180px]">— {item.name}</span>}
        </div>
        {total > 1 && (
          <button onClick={() => onRemove(item.id)} className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Image */}
        <ImageDropZone item={item} onFile={file => {
          const preview = URL.createObjectURL(file);
          onChange(item.id, { imageFile: file, imagePreview: preview, status: "idle", errorMsg: "" });
        }} />

        {/* Right: Fields */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Product Name *</label>
            <input
              type="text"
              value={item.name}
              onChange={e => onChange(item.id, { name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="e.g. LED Bulb 12W"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
            <select
              value={item.category}
              onChange={e => onChange(item.id, { category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            >
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-3 gap-2">
            {(["buying_price", "wholesale_price", "retail_price"] as const).map((field, i) => (
              <div key={field}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {["Cost", "Wholesale", "Retail"][i]}
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">KES</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={item.prices[field]}
                    onChange={e => onChange(item.id, { prices: { ...item.prices, [field]: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-2 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>

          {margin !== null && (
            <div className="flex items-center justify-between text-xs bg-slate-100 rounded-lg px-3 py-2">
              <span className="text-slate-500">Retail Margin</span>
              <span className={`font-bold ${margin >= 20 ? "text-green-600" : margin >= 10 ? "text-amber-600" : "text-red-500"}`}>
                {margin}%
              </span>
            </div>
          )}

          {item.errorMsg && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <AlertCircle size={12} /> {item.errorMsg}
            </p>
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

    const supabase = createSupabaseBrowserClient();
    const ext = item.imageFile.name.split(".").pop();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Simulate progress
    let prog = 10;
    const ticker = setInterval(() => {
      prog = Math.min(prog + 15, 85);
      if (isEdit) setEditItem(p => ({ ...p, uploadProgress: prog, status: "uploading" }));
      else updateQueue(item.id, { uploadProgress: prog, status: "uploading" });
    }, 200);

    const { error } = await supabase.storage.from("images").upload(path, item.imageFile, { upsert: true });
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
    if (!editItem.name.trim()) { addToast("Product name is required.", "error"); return; }
    if (!editItem.imageFile && !editItem.image_url) { addToast("Please upload a product image.", "error"); return; }
    setSubmitting(true);
    try {
      const imageUrl = await uploadImage(editItem);
      const result = await updateProduct(initialData!.id, {
        name: editItem.name,
        category: editItem.category,
        image_url: imageUrl,
        buying_price: +editItem.prices.buying_price,
        wholesale_price: +editItem.prices.wholesale_price,
        retail_price: +editItem.prices.retail_price,
      });
      if (result?.error) throw new Error(result.error);
      addToast("Product updated successfully!", "success");
      setTimeout(() => router.push("/admin"), 1200);
    } catch (err) {
      setEditItem(p => ({ ...p, status: "error", errorMsg: err instanceof Error ? err.message : "Unknown error" }));
      addToast(err instanceof Error ? err.message : "Failed to save.", "error");
      setSubmitting(false);
    }
  };

  // ── Bulk add submit ──
  const handleBulkSubmit = async () => {
    // Validate
    for (const item of queue) {
      if (!item.name.trim()) { addToast(`Item ${queue.indexOf(item) + 1}: name is required.`, "error"); return; }
      if (!item.imageFile && !item.image_url) { addToast(`Item ${queue.indexOf(item) + 1}: image is required.`, "error"); return; }
    }
    setSubmitting(true);

    // Upload images sequentially
    const finalUrls: Record<string, string> = {};
    for (const item of queue) {
      try {
        updateQueue(item.id, { status: "uploading", uploadProgress: 5 });
        finalUrls[item.id] = await uploadImage(item);
        updateQueue(item.id, { status: "done", uploadProgress: 100 });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        updateQueue(item.id, { status: "error", errorMsg: msg });
        addToast(`Failed to upload image for "${item.name}".`, "error");
        setSubmitting(false);
        return;
      }
    }

    // Bulk insert
    const payload = queue.map(item => ({
      name: item.name,
      category: item.category,
      image_url: finalUrls[item.id],
      buying_price: +item.prices.buying_price,
      wholesale_price: +item.prices.wholesale_price,
      retail_price: +item.prices.retail_price,
    }));

    try {
      const result = await addProducts(payload);
      if (result?.error) throw new Error(result.error);
      addToast(`${result.count} product${result.count === 1 ? "" : "s"} added successfully! 🎉`, "success");
      setTimeout(() => router.push("/admin"), 1500);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save products.", "error");
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans">

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium backdrop-blur pointer-events-auto animate-fade-in
            ${t.type === "success" ? "bg-green-600 text-white" : t.type === "error" ? "bg-red-600 text-white" : "bg-slate-800 text-white"}`}>
            {t.type === "success" && <CheckCircle2 size={16} />}
            {t.type === "error" && <AlertCircle size={16} />}
            {t.msg}
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto py-10 px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-xs font-semibold mb-3 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEdit ? `Edit: ${initialData.name}` : "Add Products"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isEdit ? "Update product details and pricing." : "Fill in each item's details, then submit all at once."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isEdit && (
              <button
                onClick={addToQueue}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
              >
                <Plus size={16} /> Add Another Item
              </button>
            )}
            <button
              onClick={isEdit ? handleEditSubmit : handleBulkSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all shadow-sm disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : isEdit ? <Save size={16} /> : <PackagePlus size={16} />}
              {submitting ? "Saving..." : isEdit ? "Save Changes" : `Submit ${queue.length > 1 ? `${queue.length} Items` : "Item"}`}
            </button>
          </div>
        </div>

        {/* Queue / Edit cards */}
        <div className="flex flex-col gap-5">
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
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={addToQueue}
              disabled={submitting}
              className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:text-blue-800 transition-colors disabled:opacity-50"
            >
              <Plus size={16} /> Add another item
            </button>
            <p className="text-xs text-slate-400">{queue.length} item{queue.length !== 1 ? "s" : ""} queued</p>
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
