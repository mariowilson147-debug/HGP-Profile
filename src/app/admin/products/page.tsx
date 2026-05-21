"use client";

import { useEffect, useState, useMemo } from "react";
import { getProducts, deleteProduct, getDbCategories, Category } from "@/lib/actions";
import { Product } from "@/lib/actions";
import Link from "next/link";
import {
  Trash2, Plus, Filter, Database, Package,
  Eye, EyeOff, Archive, Star, Search, ChevronLeft, ChevronRight,
  Flower2, Pencil, MoreHorizontal, X
} from "lucide-react";

// ─── Status & Visibility Badges ──────────────────────────────────────────────

const availabilityConfig = {
  in_stock:    { label: "In Stock",    color: "#4cd7f6", bg: "rgba(76,215,246,0.1)",  border: "rgba(76,215,246,0.3)"  },
  out_of_stock:{ label: "Depleted",    color: "#ffb4ab", bg: "rgba(255,180,171,0.1)", border: "rgba(255,180,171,0.3)" },
  coming_soon: { label: "Inbound",     color: "#c0c1ff", bg: "rgba(192,193,255,0.1)", border: "rgba(192,193,255,0.3)" },
};

const visibilityConfig = {
  visible:  { icon: Eye,     label: "Public",   color: "#4cd7f6" },
  hidden:   { icon: EyeOff,  label: "Hidden",   color: "#7a8cb0" },
  archived: { icon: Archive, label: "Archived", color: "#ffb4ab" },
};

// ─── Single Product Card ──────────────────────────────────────────────────────

function ProductCard({
  product,
  category,
  deletingId,
  onDelete,
}: {
  product: Product;
  category?: Category;
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDeleting = deletingId === product.id;

  const avail = availabilityConfig[product.availability as keyof typeof availabilityConfig] ?? availabilityConfig.in_stock;
  const vis   = visibilityConfig[product.visibility as keyof typeof visibilityConfig] ?? visibilityConfig.visible;
  const VisIcon = vis.icon;
  const isFlower = product.category === "Flowers";
  const compType = product.attributes?.component_type as string | undefined;

  const margin =
    product.buying_price && product.retail_price
      ? Math.round(((product.retail_price - product.buying_price) / product.retail_price) * 100)
      : null;

  return (
    <div className="admin-product-card flex flex-col group relative">

      {/* Image */}
      <Link href={`/admin/product/${product.id}`} className="block relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 grayscale-[30%] group-hover:grayscale-0"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#060e20]">
            <Package size={32} className="text-apex-outline-variant" strokeWidth={1} />
          </div>
        )}

        {/* Top overlay badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_featured && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest font-apex-mono"
              style={{ background: "rgba(192,193,255,0.15)", color: "#c0c1ff", border: "1px solid rgba(192,193,255,0.3)" }}>
              <Star size={8} /> FEATURED
            </span>
          )}
          {isFlower && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest font-apex-mono"
              style={{ background: "rgba(236,72,153,0.15)", color: "#f472b6", border: "1px solid rgba(236,72,153,0.3)" }}>
              <Flower2 size={8} /> {compType === "vase" ? "VASE" : compType === "arrangement" ? "ARRANGEMENT" : "FLOWER"}
            </span>
          )}
        </div>

        {/* Visibility icon top-right */}
        <div className="absolute top-2 right-2 p-1 rounded" style={{ background: "rgba(8,15,30,0.7)" }}>
          <VisIcon size={12} style={{ color: vis.color }} />
        </div>

        {/* Gradient scrim at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{ background: "linear-gradient(to top, #131b2e, transparent)" }} />
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Name + Category */}
        <div>
          <Link href={`/admin/product/${product.id}`}>
            <p className="font-bold text-sm leading-snug text-apex-text font-apex-sans tracking-wide line-clamp-1 hover:text-apex-primary transition-colors">
              {product.name}
            </p>
          </Link>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest font-apex-mono px-2 py-0.5 rounded"
              style={{ background: "rgba(76,215,246,0.08)", color: "#4cd7f6", border: "1px solid rgba(76,215,246,0.2)" }}>
              {product.category || "—"}
            </span>
            <span className="text-[9px] font-apex-mono uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: avail.bg, color: avail.color, border: `1px solid ${avail.border}` }}>
              {avail.label}
            </span>
          </div>
        </div>

        {/* Pricing row */}
        <div className="flex items-end justify-between gap-2 pt-2 border-t border-apex-outline-variant/20">
          <div>
            <p className="text-[9px] text-apex-on-surface-variant font-apex-mono uppercase tracking-widest mb-0.5">Retail</p>
            <p className="text-base font-black font-apex-sans leading-none text-apex-text">
              {(product.retail_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              <span className="text-[9px] font-normal text-apex-on-surface-variant ml-1 font-apex-mono">KES</span>
            </p>
          </div>
          {margin !== null && (
            <span
              className="text-[9px] font-bold font-apex-mono uppercase tracking-widest px-2 py-1 rounded"
              style={{
                background: margin >= 20 ? "rgba(76,215,246,0.1)" : margin >= 10 ? "rgba(245,158,11,0.1)" : "rgba(255,180,171,0.1)",
                color: margin >= 20 ? "#4cd7f6" : margin >= 10 ? "#f59e0b" : "#ffb4ab",
                border: `1px solid ${margin >= 20 ? "rgba(76,215,246,0.3)" : margin >= 10 ? "rgba(245,158,11,0.3)" : "rgba(255,180,171,0.3)"}`,
              }}>
              {margin}% margin
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <Link
            href={`/admin/product/${product.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-[10px] font-bold uppercase tracking-widest font-apex-mono transition-all"
            style={{
              background: "rgba(192,193,255,0.08)",
              color: "#c0c1ff",
              border: "1px solid rgba(192,193,255,0.2)",
            }}
          >
            <Pencil size={11} /> Edit
          </Link>

          {isDeleting ? (
            <button
              onClick={() => onDelete(product.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-[10px] font-bold uppercase tracking-widest font-apex-mono animate-pulse"
              style={{ background: "rgba(255,180,171,0.15)", color: "#ffb4ab", border: "1px solid rgba(255,180,171,0.4)" }}
            >
              Confirm?
            </button>
          ) : (
            <button
              onClick={() => onDelete(product.id)}
              className="p-2 rounded transition-all"
              style={{ background: "rgba(255,180,171,0.06)", color: "#7a8cb0", border: "1px solid rgba(42,58,92,0.5)" }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const loadProducts = async () => {
    setLoading(true);
    const [data, cats] = await Promise.all([getProducts(), getDbCategories()]);
    setProducts(data);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      await deleteProduct(id);
      setDeletingId(null);
      loadProducts();
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const filteredProducts = useMemo(() =>
    products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat    = selectedCategory === "all" || p.category === selectedCategory;
      return matchSearch && matchCat;
    }),
  [products, searchQuery, selectedCategory]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 12;
  const totalPages    = Math.max(1, Math.ceil(filteredProducts.length / CARDS_PER_PAGE));
  const startIndex    = (currentPage - 1) * CARDS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(startIndex, startIndex + CARDS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => setCurrentPage(1), [searchQuery, selectedCategory]);

  // Stats
  const totalRetailValue = products.reduce((s, p) => s + (p.retail_price ?? 0), 0);
  const inStockCount     = products.filter(p => p.availability === "in_stock").length;
  const featuredCount    = products.filter(p => p.is_featured).length;

  return (
    <div className="w-full min-h-screen font-apex-sans max-w-[1400px] mx-auto px-6 lg:px-8 pt-6 pb-16 space-y-8 select-none">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 rounded-sm" style={{ background: "#4cd7f6" }} />
            <h2 className="text-3xl font-black text-apex-text uppercase tracking-tight">Registry: Products</h2>
          </div>
          <p className="font-apex-mono text-[10px] mt-1.5 uppercase tracking-widest" style={{ color: "#4cd7f6" }}>
            Archive_Query [FILTER=Catalogue_All] · Records: {products.length.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin?tab=categories"
            className="flex items-center gap-2 px-4 py-2.5 rounded text-[11px] font-bold uppercase tracking-wider font-apex-mono transition-all"
            style={{ background: "rgba(42,58,92,0.5)", color: "#7a8cb0", border: "1px solid rgba(42,58,92,0.7)" }}
          >
            <Database size={13} /> Categories
          </Link>
          <Link
            href="/admin/product/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded text-[11px] font-bold uppercase tracking-widest font-apex-mono transition-all shadow-[0_0_20px_rgba(192,193,255,0.15)]"
            style={{ background: "#c0c1ff", color: "#080f1e" }}
          >
            <Plus size={13} /> New Product
          </Link>
        </div>
      </div>

      {/* ── Stat Chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: products.length, color: "#4cd7f6" },
          { label: "In Stock",       value: inStockCount,    color: "#4cd7f6" },
          { label: "Featured",       value: featuredCount,   color: "#c0c1ff" },
          { label: "Retail Value (KES)", value: totalRetailValue.toLocaleString(undefined, { maximumFractionDigits: 0 }), color: "#c0c1ff" },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-lg px-4 py-3 flex flex-col gap-1"
            style={{ background: "#131b2e", border: "1px solid rgba(42,58,92,0.7)" }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest font-apex-mono text-apex-on-surface-variant">{stat.label}</p>
            <p className="text-xl font-black leading-none font-apex-sans" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Category filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 rounded text-sm font-apex-mono focus:outline-none"
            style={{
              background: "#131b2e",
              color: "#dae2fd",
              border: "1px solid rgba(42,58,92,0.7)",
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant hover:text-apex-text">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-apex-on-surface-variant shrink-0" />
          {["all", ...categories.map(c => c.name)].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest font-apex-mono transition-all"
              style={{
                background: selectedCategory === cat ? "rgba(76,215,246,0.15)" : "rgba(42,58,92,0.3)",
                color:      selectedCategory === cat ? "#4cd7f6" : "#7a8cb0",
                border:     `1px solid ${selectedCategory === cat ? "rgba(76,215,246,0.4)" : "rgba(42,58,92,0.5)"}`,
              }}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Card Grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden animate-pulse" style={{ background: "#131b2e", border: "1px solid rgba(42,58,92,0.5)" }}>
              <div className="w-full bg-apex-outline-variant/10" style={{ aspectRatio: "4/3" }} />
              <div className="p-4 space-y-2">
                <div className="h-3 rounded bg-apex-outline-variant/20 w-3/4" />
                <div className="h-2 rounded bg-apex-outline-variant/10 w-1/2" />
                <div className="h-5 rounded bg-apex-outline-variant/20 w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-apex-on-surface-variant font-apex-mono">
          <Package size={48} strokeWidth={1} className="mb-4 opacity-30" />
          <p className="text-sm font-bold uppercase tracking-widest">No products found</p>
          <p className="text-xs mt-1 opacity-50">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visibleProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              category={categories.find(c => c.name === product.category)}
              deletingId={deletingId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 font-apex-mono text-[10px] uppercase tracking-widest">
          <span style={{ color: "#7a8cb0" }}>
            Showing {startIndex + 1}–{Math.min(startIndex + CARDS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded transition-all disabled:opacity-30"
              style={{ background: "#131b2e", border: "1px solid rgba(42,58,92,0.7)", color: "#7a8cb0" }}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 h-8 flex items-center rounded font-bold" style={{ background: "rgba(76,215,246,0.1)", color: "#4cd7f6", border: "1px solid rgba(76,215,246,0.3)" }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded transition-all disabled:opacity-30"
              style={{ background: "#131b2e", border: "1px solid rgba(42,58,92,0.7)", color: "#7a8cb0" }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
