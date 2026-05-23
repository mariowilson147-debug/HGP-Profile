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
  in_stock:    { label: "In Stock",    color: "text-apex-tertiary", bg: "bg-apex-tertiary-container",  border: "border-transparent"  },
  out_of_stock:{ label: "Depleted",    color: "text-apex-error", bg: "bg-apex-error-container", border: "border-transparent" },
  coming_soon: { label: "Inbound",     color: "text-apex-secondary", bg: "bg-apex-surface-low", border: "border-apex-outline-variant" },
};

const visibilityConfig = {
  visible:  { icon: Eye,     label: "Public",   color: "text-apex-tertiary" },
  hidden:   { icon: EyeOff,  label: "Hidden",   color: "text-apex-on-surface-variant" },
  archived: { icon: Archive, label: "Archived", color: "text-apex-error" },
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
  const isFlower = product.category === "Flowers & Vases";
  const compType = product.attributes?.component_type as string | undefined;

  const margin =
    product.buying_price && product.retail_price
      ? Math.round(((product.retail_price - product.buying_price) / product.retail_price) * 100)
      : null;

  return (
    <div className="admin-product-card flex flex-col group relative">

      {/* Image */}
      <Link href={`/admin/product/${product.id}`} className="block relative overflow-hidden bg-apex-surface-lowest" style={{ aspectRatio: "4/3" }}>
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-apex-surface-low">
            <Package size={32} className="text-apex-outline-variant" strokeWidth={1} />
          </div>
        )}

        {/* Top overlay badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_featured && (
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-apex-surface/90 text-apex-primary text-[10px] font-bold shadow-sm">
              <Star size={10} className="fill-apex-primary" /> Featured
            </span>
          )}
          {isFlower && (
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-pink-100 text-pink-600 border border-pink-200 text-[10px] font-bold shadow-sm">
              <Flower2 size={10} /> {compType === "vase" ? "Vase" : compType === "arrangement" ? "Arrangement" : "Flower"}
            </span>
          )}
        </div>

        {/* Visibility icon top-right */}
        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-apex-surface/90 shadow-sm">
          <VisIcon size={14} className={vis.color} />
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3 bg-apex-surface border-b border-l border-r border-apex-outline-variant rounded-b-xl shadow-sm">

        {/* Name + Category */}
        <div>
          <Link href={`/admin/product/${product.id}`}>
            <p className="font-semibold text-sm leading-snug text-apex-text font-apex-sans line-clamp-1 hover:text-apex-primary transition-colors">
              {product.name}
            </p>
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-apex-surface-low border border-apex-outline-variant text-apex-on-surface-variant">
              {product.category || "Uncategorized"}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${avail.bg} ${avail.color} ${avail.border}`}>
              {avail.label}
            </span>
          </div>
        </div>

        {/* Pricing row */}
        <div className="flex items-end justify-between gap-2 pt-3 border-t border-apex-outline-variant">
          <div>
            <p className="text-[10px] text-apex-on-surface-variant font-medium mb-0.5">Retail</p>
            <p className="text-lg font-bold font-apex-sans leading-none text-apex-text">
              {(product.retail_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              <span className="text-[10px] font-medium text-apex-on-surface-variant ml-1">KES</span>
            </p>
          </div>
          {margin !== null && (
            <span
              className={`text-[10px] font-medium px-2 py-1 rounded-lg ${
                margin >= 20 ? "bg-apex-tertiary-container text-apex-tertiary" : margin >= 10 ? "bg-apex-warning-container text-apex-warning" : "bg-apex-error-container text-apex-error"
              }`}>
              {margin}% margin
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Link
            href={`/admin/product/${product.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-apex-surface-low border border-apex-outline-variant hover:bg-apex-surface-highest transition-colors"
          >
            <Pencil size={14} /> Edit
          </Link>

          {isDeleting ? (
            <button
              onClick={() => onDelete(product.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-apex-error-container text-apex-error animate-pulse"
            >
              Confirm?
            </button>
          ) : (
            <button
              onClick={() => onDelete(product.id)}
              className="p-2.5 rounded-lg border border-apex-outline-variant bg-apex-surface-low text-apex-on-surface-variant hover:text-apex-error hover:bg-apex-error-container/20 transition-all"
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
          <h2 className="text-3xl font-bold text-apex-text tracking-tight">Products</h2>
          <p className="font-apex-sans text-sm text-apex-on-surface-variant mt-1.5">
            Manage your product catalog • {products.length.toLocaleString()} total
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin?tab=categories"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-apex-surface border border-apex-outline-variant hover:bg-apex-surface-low transition-all shadow-sm"
          >
            <Database size={16} /> Categories
          </Link>
          <Link
            href="/admin/product/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-apex-primary text-apex-bg hover:bg-apex-primary/90 transition-all shadow-sm"
          >
            <Plus size={16} /> New Product
          </Link>
        </div>
      </div>

      {/* ── Stat Chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: products.length, dark: true },
          { label: "In Stock",       value: inStockCount,    dark: false },
          { label: "Featured",       value: featuredCount,   dark: false },
          { label: "Retail Value",   value: `KES ${totalRetailValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, dark: true },
        ].map(stat => (
          <div
            key={stat.label}
            className={`rounded-2xl px-6 py-5 flex flex-col gap-1 shadow-sm border border-apex-outline-variant ${
              stat.dark ? "bg-apex-primary text-apex-bg" : "bg-apex-surface text-apex-text"
            }`}
          >
            <p className={`text-sm font-medium ${stat.dark ? "text-apex-bg/80" : "text-apex-on-surface-variant"}`}>{stat.label}</p>
            <p className="text-2xl font-bold leading-none font-apex-sans">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Category filter ── */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm font-apex-sans bg-apex-surface border border-apex-outline-variant focus:outline-none focus:ring-1 focus:ring-apex-primary"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant hover:text-apex-text">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-apex-on-surface-variant shrink-0 mr-1" />
          {["all", ...categories.map(c => c.name)].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat 
                  ? "bg-apex-primary text-apex-bg shadow-sm" 
                  : "bg-apex-surface border border-apex-outline-variant text-apex-text hover:bg-apex-surface-low"
              }`}
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
            <div key={i} className="rounded-xl overflow-hidden animate-pulse bg-apex-surface border border-apex-outline-variant shadow-sm">
              <div className="w-full bg-apex-surface-low" style={{ aspectRatio: "4/3" }} />
              <div className="p-4 space-y-2">
                <div className="h-3 rounded bg-apex-surface-highest w-3/4" />
                <div className="h-2 rounded bg-apex-surface-low w-1/2" />
                <div className="h-5 rounded bg-apex-surface-highest w-1/3 mt-3" />
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
        <div className="flex items-center justify-between pt-4 font-apex-sans text-sm text-apex-on-surface-variant">
          <span>
            Showing {startIndex + 1}–{Math.min(startIndex + CARDS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 border border-apex-outline-variant bg-apex-surface hover:bg-apex-surface-low"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 h-8 flex items-center rounded-lg font-medium bg-apex-surface-lowest border border-apex-outline-variant">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 border border-apex-outline-variant bg-apex-surface hover:bg-apex-surface-low"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
