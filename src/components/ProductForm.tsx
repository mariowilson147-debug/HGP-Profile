"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/actions";
import { addProducts, updateProduct, getFlowerVaseProducts, ensureFlowersCategory } from "@/lib/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSettings } from "./SettingsProvider";
import { UploadCloud, Save, Plus, Trash2, CheckCircle2,
  AlertCircle, ArrowLeft, PackagePlus, Loader2, Flower2, X, Image as ImageIcon
} from "lucide-react";
import imageCompression from 'browser-image-compression';
import { saveDraft, getDraft, deleteDraft } from "@/lib/idb";
import SelectDropdown from "@/components/ui/SelectDropdown";
import { useManagerBranch } from "@/components/ManagerBranchProvider";

// ─── Types ───────────────────────────────────────────────────────────────────

type PriceFields = { buying_price: string; wholesale_price: string; retail_price: string };

interface ExtraImage {
  id: string;
  file: File | null;
  preview: string;
  url: string;
}

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
  uploadProgress: number;
  status: "idle" | "uploading" | "done" | "error";
  errorMsg: string;
  // Multi-image
  extraImages: ExtraImage[];
  // Flower-specific
  componentType: 'arrangement' | 'vase' | '';
  compatibleVaseIds: string[];
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
    extraImages: [],
    componentType: '',
    compatibleVaseIds: [],
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

// ─── Primary Image Drop Zone ──────────────────────────────────────────────────

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
        ${dragging ? "border-apex-primary bg-apex-primary/10" : "border-dashed border-apex-outline-variant bg-apex-surface hover:border-apex-primary/50 hover:bg-apex-surface-low"}`}
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
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
            <span className="text-white bg-black/50 backdrop-blur font-medium text-xs px-4 py-2 rounded-full">
              REPLACE VISUAL ASSET
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 p-6 text-center select-none">
          <UploadCloud size={32} className={`transition-colors ${dragging ? "text-apex-primary" : "text-apex-outline-variant/50"}`} />
          <div>
            <p className="text-sm font-medium text-apex-text">Drop primary image here</p>
            <p className="text-xs text-apex-on-surface-variant mt-1">or click to browse</p>
          </div>
        </div>
      )}

      {item.status === "uploading" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-apex-surface-highest">
          <div
            className="h-full bg-apex-primary transition-all duration-300 "
            style={{ width: `${item.uploadProgress}%` }}
          />
        </div>
      )}

      {item.status === "done" && (
        <div className="absolute top-2 right-2 bg-apex-secondary text-apex-bg rounded-full p-1 shadow-sm">
          <CheckCircle2 size={12} />
        </div>
      )}
      {item.status === "error" && (
        <div className="absolute top-2 right-2 bg-apex-error text-apex-bg rounded-full p-1 shadow-sm">
          <AlertCircle size={12} />
        </div>
      )}
    </div>
  );
}

// ─── Extra Image Slot ────────────────────────────────────────────────────────

function ExtraImageSlot({
  image,
  onFile,
  onRemove,
}: {
  image: ExtraImage;
  onFile: (id: string, file: File) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImage = image.preview || image.url;

  return (
    <div
      className={`relative rounded border overflow-hidden flex flex-col items-center justify-center aspect-square cursor-pointer transition-all duration-200
        ${hasImage ? "border-apex-outline-variant/30" : "border-dashed border-apex-outline-variant bg-apex-surface hover:border-apex-primary/40"}`}
      onClick={() => !hasImage && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(image.id, f); }}
      />
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.preview || image.url} alt="variation" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center gap-1 opacity-0 hover:opacity-100">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
              className="p-1 bg-apex-surface/80 rounded text-slate-800 hover:bg-apex-surface transition-colors"
              title="Replace image"
            >
              <ImageIcon size={12} />
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRemove(image.id); }}
              className="p-1 bg-apex-error/80 rounded text-apex-bg hover:bg-apex-error transition-colors"
              title="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 p-2 text-center">
          <Plus size={16} className="text-apex-outline-variant/40" />
          <span className="text-xs font-medium text-apex-on-surface-variant">Add</span>
        </div>
      )}
    </div>
  );
}

// ─── Multi-Image Section ───────────────────────────────────────────────────

function MultiImageSection({
  item,
  onChange,
}: {
  item: QueueItem;
  onChange: (id: string, patch: Partial<QueueItem>) => void;
}) {
  const MAX_EXTRA = 4;

  const handleExtraFile = (imageId: string, file: File) => {
    const preview = URL.createObjectURL(file);
    onChange(item.id, {
      extraImages: item.extraImages.map(img =>
        img.id === imageId ? { ...img, file, preview, url: "" } : img
      ),
    });
  };

  const handleRemoveExtra = (imageId: string) => {
    onChange(item.id, { extraImages: item.extraImages.filter(img => img.id !== imageId) });
  };

  const addExtraSlot = () => {
    if (item.extraImages.length >= MAX_EXTRA) return;
    onChange(item.id, {
      extraImages: [...item.extraImages, { id: crypto.randomUUID(), file: null, preview: "", url: "" }],
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-apex-text">
          Variation Images ({item.extraImages.filter(i => i.preview || i.url).length + (item.imagePreview || item.image_url ? 1 : 0)}/5)
        </label>
        {item.extraImages.length < MAX_EXTRA && (
          <button
            type="button"
            onClick={addExtraSlot}
            className="text-sm font-medium text-apex-primary hover:text-apex-primary/80 transition-colors flex items-center gap-1"
          >
            <Plus size={10} /> Add Variation
          </button>
        )}
      </div>

      {item.extraImages.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {item.extraImages.map(img => (
            <ExtraImageSlot
              key={img.id}
              image={img}
              onFile={handleExtraFile}
              onRemove={handleRemoveExtra}
            />
          ))}
        </div>
      )}

      {item.extraImages.length === 0 && (
        <p className="text-[9px] text-apex-outline-variant/40 font-apex-mono uppercase tracking-widest mt-1">
          Click &quot;Add Variation&quot; to upload additional product images (max 4 extra)
        </p>
      )}
    </div>
  );
}

// ─── Flower Configuration Section ────────────────────────────────────────────

function FlowerConfigSection({
  item,
  vaseProducts,
  onChange,
}: {
  item: QueueItem;
  vaseProducts: Product[];
  onChange: (id: string, patch: Partial<QueueItem>) => void;
}) {
  const toggleVase = (vaseId: string) => {
    const current = item.compatibleVaseIds;
    const updated = current.includes(vaseId)
      ? current.filter(v => v !== vaseId)
      : [...current, vaseId];
    onChange(item.id, { compatibleVaseIds: updated });
  };

  return (
    <div className="border border-pink-500/30 bg-pink-500/5 rounded p-4 mt-2">
      <div className="flex items-center gap-2 mb-4">
        <Flower2 size={14} className="text-pink-400" />
        <span className="text-sm font-medium text-pink-600">Flower Configuration</span>
      </div>

      {/* Component Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-apex-text mb-2">
          Component Type *
        </label>
        <div className="flex gap-3">
          {(['arrangement', 'vase'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => onChange(item.id, {
                componentType: type,
                compatibleVaseIds: type === 'vase' ? [] : item.compatibleVaseIds,
              })}
              className={`flex-1 py-2 text-sm font-medium rounded border transition-all
                ${item.componentType === type
                  ? "border-pink-400 bg-pink-400/10 text-pink-400"
                  : "border-apex-outline-variant/30 text-apex-on-surface-variant/60 hover:border-pink-400/50"
                }`}
            >
              {type === 'arrangement' ? '🌸 ARRANGEMENT' : '🏺 VASE ONLY'}
            </button>
          ))}
        </div>
        {!item.componentType && (
          <p className="text-[9px] text-apex-error font-apex-mono mt-1 uppercase tracking-widest">
            Please select a component type
          </p>
        )}
      </div>

      {/* Arrangement-specific fields */}
      {item.componentType === 'arrangement' && (
        <>
          {/* Compatible vases */}
          <div>
            <label className="block text-sm font-medium text-apex-text mb-2">
              Compatible Vases ({item.compatibleVaseIds.length} selected)
            </label>
            {vaseProducts.length === 0 ? (
              <div className="border border-dashed border-apex-outline-variant/20 rounded p-3 text-center">
                <p className="text-[9px] text-apex-on-surface-variant/40 font-apex-mono uppercase tracking-widest">
                  No vase products found in Flowers category.
                  Upload vase products first (Component Type: Vase Only).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
                {vaseProducts.map(vase => {
                  const selected = item.compatibleVaseIds.includes(vase.id);
                  return (
                    <button
                      key={vase.id}
                      type="button"
                      onClick={() => toggleVase(vase.id)}
                      className={`flex items-center gap-2 p-2 rounded border text-left transition-all
                        ${selected
                          ? "border-pink-400 bg-pink-400/10"
                          : "border-apex-outline-variant/20 bg-apex-surface hover:border-pink-400/40"
                        }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={vase.image_url}
                        alt={vase.name}
                        className="w-8 h-8 object-cover rounded shrink-0"
                      />
                      <div className="min-w-0">
                        <p className={`text-[9px] font-bold truncate font-apex-mono ${selected ? "text-pink-400" : "text-apex-text"}`}>
                          {vase.name}
                        </p>
                        <p className="text-[8px] text-apex-on-surface-variant/50 font-apex-mono">
                          KES {vase.retail_price?.toLocaleString()}
                        </p>
                      </div>
                      {selected && <CheckCircle2 size={12} className="text-pink-400 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Vase-only info */}
      {item.componentType === 'vase' && (
        <div className="text-[9px] text-apex-on-surface-variant/50 font-apex-mono uppercase tracking-widest bg-apex-surface border border-apex-outline-variant/10 rounded p-3">
          This vase will appear as a compatible option when clients browse flower arrangements.
          Set its price in the Financial Metrics section above.
        </div>
      )}
    </div>
  );
}

// ─── Single Queue Card ────────────────────────────────────────────────────────

function QueueCard({
  item, index, total, categories, vaseProducts, onChange, onRemove
}: {
  item: QueueItem;
  index: number;
  total: number;
  categories: { id: string; name: string }[];
  vaseProducts: Product[];
  onChange: (id: string, patch: Partial<QueueItem>) => void;
  onRemove: (id: string) => void;
}) {
  const margin = item.prices.buying_price && item.prices.retail_price
    ? Math.round(((+item.prices.retail_price - +item.prices.buying_price) / +item.prices.retail_price) * 100)
    : null;

  const isFlower = item.category === "Flowers & Vases";
  const isArrangement = isFlower && item.componentType === 'arrangement';

  return (
    <div className={`bg-apex-surface rounded-2xl border transition-all duration-200 relative overflow-hidden shadow-sm
      ${item.status === "done" ? "border-apex-secondary/30" : item.status === "error" ? "border-apex-error/30" : "border-apex-outline-variant/20"}`}>

      {item.status === "done" && <div className="absolute top-0 left-0 w-1 h-full bg-apex-secondary"></div>}
      {item.status === "error" && <div className="absolute top-0 left-0 w-1 h-full bg-apex-error"></div>}

      {/* Card header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-apex-outline-variant bg-apex-surface-lowest">
        <div className="flex items-center gap-3">
          {item.status === "uploading" && <Loader2 size={14} className="animate-spin text-apex-primary" />}
          {item.status === "done" && <CheckCircle2 size={14} className="text-apex-secondary" />}
          {item.status === "error" && <AlertCircle size={14} className="text-apex-error" />}
          <span className="text-sm font-medium text-apex-primary">
            Item {index + 1}
          </span>
          {item.name && <span className="text-sm text-apex-on-surface-variant truncate max-w-[200px]">{"//"} {item.name}</span>}
          {isFlower && <span className="text-xs text-pink-600 font-medium bg-pink-50 px-2 py-0.5 rounded-full">Flowers & Vases</span>}
        </div>
        {total > 1 && (
          <button onClick={() => onRemove(item.id)} className="p-1.5 rounded-lg text-apex-error hover:bg-apex-error/10 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-apex-surface-lowest/50">
        {/* Left Column: General, Media, Configuration */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Card: General Information */}
          <div className="bg-apex-surface rounded-xl border border-apex-outline-variant/30 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-apex-text mb-4">General Information</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-apex-on-surface-variant mb-1">Product Name *</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={e => onChange(item.id, { name: e.target.value })}
                  className="w-full bg-apex-surface border border-apex-outline-variant rounded-lg px-4 py-2.5 text-sm text-apex-text focus:outline-none focus:border-apex-primary focus:ring-1 focus:ring-apex-primary transition-all placeholder:text-apex-on-surface-variant/30"
                  placeholder="e.g. Sunset Bouquet"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-apex-on-surface-variant mb-1">Category</label>
                  <SelectDropdown
                    value={item.category}
                    onChange={(val) => onChange(item.id, { category: val, componentType: '', compatibleVaseIds: [] })}
                    options={categories.map(c => ({ label: c.name, value: c.name }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-apex-on-surface-variant mb-1">Tags</label>
                  <input
                    type="text"
                    value={item.tags}
                    onChange={e => onChange(item.id, { tags: e.target.value })}
                    className="w-full bg-apex-surface border border-apex-outline-variant rounded-lg px-4 py-2.5 text-sm text-apex-text focus:outline-none focus:border-apex-primary focus:ring-1 focus:ring-apex-primary transition-all placeholder:text-apex-on-surface-variant/30"
                    placeholder="e.g. promo, new, featured"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Media */}
          <div className="bg-apex-surface rounded-xl border border-apex-outline-variant/30 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-apex-text mb-4">Media</h3>
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-xs font-medium text-apex-on-surface-variant mb-2">Primary Image *</label>
                <ImageDropZone item={item} onFile={file => {
                  const preview = URL.createObjectURL(file);
                  onChange(item.id, { imageFile: file, imagePreview: preview, status: "idle", errorMsg: "" });
                }} />
              </div>
              <MultiImageSection item={item} onChange={onChange} />
            </div>
          </div>

          {/* Card: Flower Configuration */}
          {isFlower && (
            <div className="bg-apex-surface rounded-xl border border-pink-200 p-0 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-pink-400"></div>
              <div className="p-1 pl-2">
                <FlowerConfigSection item={item} vaseProducts={vaseProducts} onChange={onChange} />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Status */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card: Status */}
          <div className="bg-apex-surface rounded-xl border border-apex-outline-variant/30 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-apex-text mb-4">Status & Visibility</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-apex-on-surface-variant mb-1">Visibility</label>
                <SelectDropdown
                  value={item.visibility}
                  onChange={(val) => onChange(item.id, { visibility: val as 'visible' | 'hidden' | 'archived' })}
                  options={[
                    { label: 'Public (Visible)', value: 'visible' },
                    { label: 'Hidden (Admin Only)', value: 'hidden' },
                    { label: 'Archived', value: 'archived' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-apex-on-surface-variant mb-1">Availability</label>
                <SelectDropdown
                  value={item.availability}
                  onChange={(val) => onChange(item.id, { availability: val as 'in_stock' | 'out_of_stock' | 'coming_soon' })}
                  options={[
                    { label: 'In Stock', value: 'in_stock' },
                    { label: 'Out of Stock', value: 'out_of_stock' },
                    { label: 'Coming Soon', value: 'coming_soon' }
                  ]}
                />
              </div>
              
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-apex-surface-low transition-colors -ml-2">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={item.is_featured}
                      onChange={e => onChange(item.id, { is_featured: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 bg-apex-surface border border-apex-outline-variant rounded-full transition-colors ${item.is_featured ? 'bg-apex-secondary/20 border-apex-secondary/50' : ''}`}></div>
                    <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-apex-on-surface-variant/40 rounded-full transition-transform duration-200 ${item.is_featured ? 'translate-x-4 bg-apex-secondary' : ''}`}></div>
                  </div>
                  <span className="text-sm font-medium text-apex-text group-hover:text-apex-primary transition-colors">
                    Featured Product
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Card: Pricing */}
          <div className="bg-apex-surface rounded-xl border border-apex-outline-variant/30 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-apex-text mb-4">Pricing</h3>
            <div className="flex flex-col gap-4">
              {(["buying_price", "wholesale_price", "retail_price"] as const).map((field, i) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-apex-on-surface-variant mb-1">
                    {["Cost Price", "Wholesale Price", "Retail Price"][i]}
                    {isArrangement && <span className="text-pink-500 ml-1">(Stem Only)</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-apex-on-surface-variant/50">KES</span>
                    <input
                      type="number" step="0.01" min="0"
                      value={item.prices[field]}
                      onChange={e => onChange(item.id, { prices: { ...item.prices, [field]: e.target.value } })}
                      className="w-full bg-apex-surface border border-apex-outline-variant rounded-lg pl-9 pr-3 py-2 text-sm text-apex-text focus:outline-none focus:border-apex-secondary focus:ring-1 focus:ring-apex-secondary transition-all placeholder:text-apex-on-surface-variant/20"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}

              {margin !== null && (
                <div className="mt-2 flex items-center justify-between bg-apex-surface-lowest rounded-lg px-3 py-2 border border-apex-outline-variant/20">
                  <span className="text-xs font-medium text-apex-on-surface-variant">Profit Margin</span>
                  <span className={`text-sm font-bold ${margin >= 20 ? "text-green-600" : margin >= 10 ? "text-amber-500" : "text-red-500"}`}>
                    {margin}%
                  </span>
                </div>
              )}

              {isArrangement && item.compatibleVaseIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-apex-outline-variant/20">
                  <h4 className="text-xs font-semibold text-apex-text mb-2">Auto-Calculated Arrangement Prices</h4>
                  <div className="flex flex-col gap-2">
                    {item.compatibleVaseIds.map(vaseId => {
                      const vase = vaseProducts.find(v => v.id === vaseId);
                      if (!vase) return null;
                      
                      const stemW = parseFloat(item.prices.wholesale_price) || 0;
                      const stemR = parseFloat(item.prices.retail_price) || 0;
                      const vaseW = vase.wholesale_price || 0;
                      const vaseR = vase.retail_price || 0;

                      return (
                        <div key={vaseId} className="flex flex-col bg-pink-500/5 border border-pink-500/20 rounded-lg p-2.5">
                          <span className="text-xs font-medium text-pink-700 mb-1">{vase.name}</span>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-apex-on-surface-variant font-semibold">Wholesale: KES {(stemW + vaseW).toLocaleString()}</span>
                            <span className="text-apex-on-surface-variant font-semibold">Retail: KES {(stemR + vaseR).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {item.errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-3 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> 
              <span>{item.errorMsg}</span>
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
  const [vaseProducts, setVaseProducts] = useState<Product[]>([]);
  const managerBranch = useManagerBranch();
  const selectedBranchId = managerBranch?.selectedBranchId;

  // Always guarantee "Flowers" appears in the category dropdown so the
  // FlowerConfigSection (component_type, vase selector, stem price) is
  // accessible even before the admin has explicitly created the category.
  const categoriesWithFlowers = useMemo(() => {
    const cats = settings.categories;
    const hasFlowers = cats.some(c => c.name === 'Flowers & Vases');
    if (hasFlowers) return cats;
    const flowerEntry = {
      id: '__flowers_virtual__',
      name: 'Flowers & Vases',
      sku_prefix: 'FLW',
      icon_name: 'Flower2',
      parent_id: null,
      is_featured: true,
      is_visible: true,
      banner_url: null,
      sort_order: -1,
    };
    return [flowerEntry, ...cats];
  }, [settings.categories]);

  const defaultCategory = categoriesWithFlowers[0]?.name || "General";
  const isEdit = !!initialData;

  // Load vase products for flower config
  useEffect(() => {
    getFlowerVaseProducts().then(setVaseProducts).catch(console.error);
  }, []);

  // Edit mode single-item state
  const [editItem, setEditItem] = useState<QueueItem>(() => {
    if (!initialData) return blankItem(defaultCategory);
    const attrs = initialData.attributes || {};
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
      extraImages: Array.isArray(attrs.image_urls)
        ? (attrs.image_urls as string[]).map(url => ({ id: crypto.randomUUID(), file: null, preview: "", url }))
        : [],
      componentType: (attrs.component_type as 'arrangement' | 'vase' | '') || '',
      compatibleVaseIds: Array.isArray(attrs.compatible_vase_ids) ? (attrs.compatible_vase_ids as string[]) : [],
    };
  });

  // Add mode: queue of items
  const [queue, setQueue] = useState<QueueItem[]>([blankItem(defaultCategory)]);
  const [submitting, setSubmitting] = useState(false);

  const updateQueue = (id: string, patch: Partial<QueueItem>) =>
    setQueue(q => q.map(it => it.id === id ? { ...it, ...patch } : it));

  const addToQueue = () => setQueue(q => [...q, blankItem(defaultCategory)]);
  const removeFromQueue = (id: string) => setQueue(q => q.filter(it => it.id !== id));

  // Upload a single image file
  const uploadImageFile = async (file: File): Promise<string> => {
    const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' as const };
    let fileToUpload = file;
    let ext = file.name.split(".").pop() || 'webp';
    try {
      fileToUpload = await imageCompression(file, options);
      ext = 'webp';
    } catch { /* use original */ }

    const supabase = createSupabaseBrowserClient();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("images").upload(path, fileToUpload, { upsert: true });
    if (error) throw new Error("Image upload failed: " + error.message);
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data.publicUrl;
  };

  // Upload primary + extra images for an item
  const uploadAllImages = async (item: QueueItem): Promise<{ primaryUrl: string; extraUrls: string[] }> => {
    // Primary
    let primaryUrl = item.image_url;
    if (item.imageFile) {
      if (isEdit) setEditItem(p => ({ ...p, status: "uploading", uploadProgress: 10 }));
      else updateQueue(item.id, { status: "uploading", uploadProgress: 10 });
      primaryUrl = await uploadImageFile(item.imageFile);
    }

    // Extra images
    const extraUrls: string[] = [];
    for (const extra of item.extraImages) {
      if (extra.file) {
        const url = await uploadImageFile(extra.file);
        extraUrls.push(url);
      } else if (extra.url) {
        extraUrls.push(extra.url);
      }
    }

    if (isEdit) setEditItem(p => ({ ...p, status: "done", uploadProgress: 100 }));
    else updateQueue(item.id, { status: "done", uploadProgress: 100 });

    return { primaryUrl, extraUrls };
  };

  // Build attributes object from item
  const buildAttributes = (item: QueueItem, extraUrls: string[]): Record<string, string | string[]> => {
    // Start from existing attributes, keeping only string | string[] values
    const base = initialData?.attributes || {};
    const attrs: Record<string, string | string[]> = {};
    for (const [k, v] of Object.entries(base)) {
      if (typeof v === 'string') attrs[k] = v;
      else if (Array.isArray(v)) attrs[k] = v.map(String);
    }
    attrs.image_urls = extraUrls;
    if (item.category === 'Flowers & Vases') {
      attrs.component_type = item.componentType;
      if (item.componentType === 'arrangement') {
        attrs.compatible_vase_ids = item.compatibleVaseIds;
      }
    }
    return attrs;
  };

  // ── Edit mode submit ──
  const handleEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editItem.name.trim()) { addToast("Product Name is required.", "error"); return; }
    if (!editItem.imageFile && !editItem.image_url) { addToast("PRIMARY IMAGE is required.", "error"); return; }
    if (editItem.category === 'Flowers & Vases' && !editItem.componentType) { addToast("Select a Flower Component Type.", "error"); return; }
    setSubmitting(true);

    // Ensure Flowers category exists in DB
    if (editItem.category === 'Flowers & Vases') await ensureFlowersCategory();

    try {
      const { primaryUrl, extraUrls } = await uploadAllImages(editItem);
      const result = await updateProduct(initialData!.id, {
        name: editItem.name,
        category: editItem.category.trim(),
        image_url: primaryUrl,
        buying_price: +editItem.prices.buying_price,
        wholesale_price: +editItem.prices.wholesale_price,
        retail_price: +editItem.prices.retail_price,
        visibility: editItem.visibility,
        availability: editItem.availability,
        is_featured: editItem.is_featured,
        tags: editItem.tags.split(',').map(t => t.trim()).filter(Boolean),
        sort_order: initialData!.sort_order || 0,
        attributes: buildAttributes(editItem, extraUrls),
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

  const handleBulkSubmit = async () => {
    const names = new Set<string>();
    for (const item of queue) {
      if (!item.name.trim()) { addToast(`Item ${queue.indexOf(item) + 1}: Name is required.`, "error"); return; }
      if (!item.imageFile && !item.image_url) { addToast(`Item ${queue.indexOf(item) + 1}: PRIMARY IMAGE is required.`, "error"); return; }
      if (item.category === 'Flowers & Vases' && !item.componentType) { addToast(`Item ${queue.indexOf(item) + 1}: Select Flower Component Type.`, "error"); return; }
      
      const lowerName = item.name.trim().toLowerCase();
      if (names.has(lowerName)) {
        addToast(`Duplicate name in queue: "${item.name}". Names must be unique.`, "error");
        return;
      }
      names.add(lowerName);
    }
    setSubmitting(true);

    // Ensure Flowers category if any item uses it
    if (queue.some(i => i.category === 'Flowers & Vases')) await ensureFlowersCategory();

    const payloads = await Promise.all(queue.map(async (item, idx) => {
      const { primaryUrl, extraUrls } = await uploadAllImages(item);
      return {
        name: item.name,
        category: item.category.trim(),
        image_url: primaryUrl,
        buying_price: +item.prices.buying_price,
        wholesale_price: +item.prices.wholesale_price,
        retail_price: +item.prices.retail_price,
        visibility: item.visibility,
        availability: item.availability,
        is_featured: item.is_featured,
        tags: item.tags.split(',').map(t => t.trim()).filter(Boolean),
        attributes: buildAttributes(item, extraUrls),
        sort_order: idx,
      };
    }));

    try {
      const result = await addProducts(payloads);
      if (result?.error) throw new Error(result.error);
      
      // Auto-add to inventory if a branch is selected
      if (selectedBranchId && result.data && Array.isArray(result.data)) {
        const supabase = createSupabaseBrowserClient();
        const inventoryPayloads = result.data.map((p: Record<string, unknown>) => ({
          branch_id: selectedBranchId,
          product_id: p.id,
          stock_level: 0,
          reorder_level: 5,
          branch_buying_price: p.buying_price,
          branch_wholesale_price: p.wholesale_price,
          branch_retail_price: p.retail_price
        }));
        await supabase.from('inventory').insert(inventoryPayloads);
      }

      await deleteDraft('product_queue'); // Clear draft on success
      
      addToast(`SUCCESSFULLY ADDED ${queue.length} ITEM(S) TO REGISTRY`, "success");
      setQueue([blankItem(defaultCategory)]);
      setTimeout(() => router.push("/admin/products"), 1500);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "REGISTRY_INITIALIZATION_FAILED", "error");
      setSubmitting(false);
    }
  };

  // ── Auto-save Drafts ──
  useEffect(() => {
    if (isEdit) return;
    let mounted = true;
    
    getDraft('product_queue').then((draft: unknown) => {
      const draftArray = draft as QueueItem[];
      if (!mounted) return;
      if (draftArray && Array.isArray(draftArray) && draftArray.length > 0) {
        // Only restore if there's actual data
        const hasContent = draftArray.length > 1 || draftArray[0].name !== '' || draftArray[0].imageFile !== null;
        if (hasContent) {
          const restored = draftArray.map((item: QueueItem) => {
            // Regenerate object URLs from the restored File objects since blob URLs expire across sessions
            if (item.imageFile) item.imagePreview = URL.createObjectURL(item.imageFile);
            item.extraImages.forEach(img => {
              if (img.file) img.preview = URL.createObjectURL(img.file);
            });
            return item;
          });
          setQueue(restored);
          addToast("Restored unsaved draft from your last session.", "info");
        }
      }
    }).catch(err => console.error("Failed to load draft", err));
    
    return () => { mounted = false; };
  }, [isEdit, addToast]);

  useEffect(() => {
    if (isEdit) return;
    const timeout = setTimeout(() => {
      const hasContent = queue.length > 1 || queue[0].name !== '' || queue[0].imageFile !== null;
      if (hasContent) {
        saveDraft('product_queue', queue).catch(err => console.error("Failed to save draft", err));
      } else {
        deleteDraft('product_queue').catch(() => {});
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [queue, isEdit]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-screen bg-transparent font-sans">

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border backdrop-blur pointer-events-auto animate-fade-in
            ${t.type === "success" ? "bg-green-50 border-green-200 text-green-700" : t.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-apex-surface border-apex-outline-variant/30 text-apex-text"}`}>
            {t.type === "success" && <CheckCircle2 size={16} />}
            {t.type === "error" && <AlertCircle size={16} />}
            {t.msg}
          </div>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto py-8 px-8 pb-28 select-none">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-4 border-b border-apex-outline-variant/20">
          <div>
            <button
              onClick={() => router.push("/admin/products")}
              className="flex items-center gap-1.5 text-apex-on-surface-variant hover:text-apex-text text-sm font-medium mb-4 transition-colors w-fit"
            >
              <ArrowLeft size={16} /> Back to Products
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-apex-text tracking-tight">
                {isEdit ? `Edit Product: ${initialData.name}` : "Add New Products"}
              </h1>
            </div>
            <p className="text-sm text-apex-on-surface-variant mt-2">
              {isEdit ? "Update product details, pricing, and media assets." : "Upload new products to your catalog."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!isEdit && (
              <button
                onClick={addToQueue}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-apex-surface border border-apex-outline-variant/30 text-apex-text hover:bg-apex-surface-low rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Plus size={16} /> Add Another
              </button>
            )}
            <button
              onClick={isEdit ? handleEditSubmit : handleBulkSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-apex-primary text-apex-bg rounded-lg text-sm font-semibold hover:bg-apex-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Save Products"}
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
              categories={categoriesWithFlowers}
              vaseProducts={vaseProducts}
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
                categories={categoriesWithFlowers}
                vaseProducts={vaseProducts}
                onChange={updateQueue}
                onRemove={removeFromQueue}
              />
            ))
          )}
        </div>

        {/* Bottom Add / Submit bar (add mode) - Removed static bar */}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-40 bg-apex-bg/80 backdrop-blur-md border-t border-apex-outline-variant/50 p-4 px-8 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          {!isEdit && (
            <p className="text-sm font-medium text-apex-on-surface-variant">
              Queue: <span className="text-apex-text font-bold">{queue.length}</span> {queue.length === 1 ? 'item' : 'items'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!isEdit && (
            <button
              onClick={addToQueue}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-apex-surface border border-apex-outline-variant/50 text-apex-text hover:bg-apex-surface-low rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Plus size={16} /> Add Another
            </button>
          )}
          <button
            onClick={isEdit ? handleEditSubmit : handleBulkSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-apex-primary text-apex-bg rounded-lg text-sm font-semibold hover:bg-apex-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Save Products"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
        .animate-fade-in { animation: fade-in 0.25s ease both; }
      `}</style>
    </div>
  );
}
