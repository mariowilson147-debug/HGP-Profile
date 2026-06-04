"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";
import { User } from "@/components/AuthProvider";
import { useChat } from "./ChatProvider";
import { useSettings } from "./SettingsProvider";
import { Product } from "@/lib/actions";
import ImageCarousel from "./ImageCarousel";
import dynamic from "next/dynamic";

const FlowerMixMatch = dynamic(() => import("./FlowerMixMatch"), { ssr: false });

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  allProducts?: Product[];
  isClientShare?: boolean;
}

// Build full images array for a product
function getProductImages(product: Product): string[] {
  const extras = Array.isArray(product.attributes?.image_urls)
    ? (product.attributes.image_urls as string[]).filter(Boolean)
    : [];
  return [product.image_url, ...extras].filter(Boolean);
}

export default function ProductModal({ product, isOpen, onClose, user, allProducts = [], isClientShare = false }: ProductModalProps) {
  const { openChat } = useChat();
  const { settings } = useSettings();
  const [selectedOptionImage, setSelectedOptionImage] = useState<string | null>(null);

  // ── Derived values and hooks BEFORE early return (Rules of Hooks) ──────────

  const images = product ? getProductImages(product) : [];

  const isFlowerArrangement =
    product?.category === "Flowers & Vases" &&
    product?.attributes?.component_type === "arrangement";

  const isVase =
    product?.category === "Flowers & Vases" &&
    product?.attributes?.component_type === "vase";

  // Find compatible vases from allProducts
  const compatibleVases = useMemo(() => {
    if (!isFlowerArrangement || !product) return [];
    const ids = Array.isArray(product.attributes?.compatible_vase_ids)
      ? (product.attributes.compatible_vase_ids as string[])
      : [];
    return allProducts.filter(p => ids.includes(p.id));
  }, [isFlowerArrangement, product, allProducts]);

  // Find compatible arrangements from allProducts
  const compatibleArrangements = useMemo(() => {
    if (!isVase || !product) return [];
    return allProducts.filter(
      p =>
        p.category === "Flowers & Vases" &&
        p.attributes?.component_type === "arrangement" &&
        Array.isArray(p.attributes?.compatible_vase_ids) &&
        (p.attributes.compatible_vase_ids as string[]).includes(product.id)
    );
  }, [isVase, product, allProducts]);

  const arrangementCount = compatibleArrangements.length;

  // The displayed images: if an option is selected in mix-match, show it as the active slide
  const displayImages = selectedOptionImage
    ? [selectedOptionImage, ...images]
    : images;

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="relative w-full max-w-lg bg-[#EAEAEA] shadow-2xl rounded-3xl overflow-hidden my-auto"
          >
            {/* Top Image Section */}
            <div className="w-full relative bg-[#EAEAEA] h-[340px]">
              <button
                onClick={onClose}
                className="absolute top-4 left-4 z-30 w-10 h-10 flex items-center justify-center text-slate-800 hover:text-slate-500 transition-colors bg-white/60 backdrop-blur-sm rounded-full"
              >
                <X size={20} />
              </button>

              <button className="absolute top-4 right-4 z-30 w-10 h-10 flex items-center justify-center text-slate-800 hover:text-red-500 transition-colors bg-white/60 backdrop-blur-sm rounded-full">
                <Heart size={20} />
              </button>

              {/* Selected combination indicator */}
              {selectedOptionImage && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-pink-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  Viewing combination
                </div>
              )}

              <ImageCarousel
                images={displayImages}
                alt={product.name}
                fill
                objectFit="contain"
              />
            </div>

            {/* Bottom Details Section */}
            <div className="w-full bg-[#F3F3F3] px-8 py-6 flex flex-col max-h-[60vh] overflow-y-auto">
              {/* Category chip */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {product.category}
                </span>
                {isFlowerArrangement && (
                  <span className="text-[9px] font-bold bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">
                    🌸 Arrangement
                  </span>
                )}
                {isVase && (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    🏺 Vase
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-display text-slate-900 mb-4 font-normal leading-tight">
                {product.name}
              </h2>

              {/* Vase note */}
              {isVase && arrangementCount > 0 && (
                <p className="text-xs text-slate-500 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Compatible with <span className="font-semibold text-amber-700">{arrangementCount}</span> flower arrangement{arrangementCount !== 1 ? 's' : ''} in our collection.
                </p>
              )}

              {/* Pricing & Actions */}
              <div className="flex items-end justify-between gap-4 mt-auto">
                {user && !isClientShare ? (
                  <div className="flex flex-col gap-1">
                    {user.role === 'admin' && (
                      <div className="text-[10px] text-slate-500 font-medium mb-1">
                        {isFlowerArrangement ? "Stem Cost:" : "Cost:"} KES {product.buying_price?.toLocaleString()}
                      </div>
                    )}
                    <div className="text-sm font-medium text-slate-500">
                      {isFlowerArrangement ? "Stem Retail:" : "Retail:"} KES {product.retail_price?.toLocaleString()}
                    </div>
                    <div className="text-3xl font-display font-medium text-slate-900 tracking-tight flex items-baseline gap-1">
                      KES {product.wholesale_price?.toLocaleString()}
                      <span className="text-sm font-normal text-slate-500">
                        ws {isFlowerArrangement && "(stem)"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-medium text-slate-900">Request Quote</h3>
                    {isFlowerArrangement && compatibleVases.length > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Available in {compatibleVases.length} vase option{compatibleVases.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}

                {(!user || isClientShare) && (
                  <div className="flex items-center gap-2">
                    {settings.enableWhatsapp && settings.whatsappNumber && (
                      <a
                        href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in the product: ${product.name}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 bg-[#25D366] text-white text-sm font-medium hover:bg-[#20b858] transition-colors rounded-xl shadow-md flex items-center justify-center gap-2"
                      >
                        WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => {
                        onClose();
                        openChat(`Hi, I'm interested in the product: ${product.name}`);
                      }}
                      className="px-6 py-3 bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors rounded-xl shadow-md flex items-center justify-center"
                    >
                      Contact Sales
                    </button>
                  </div>
                )}
              </div>

              {/* Mix & Match section */}
              {isFlowerArrangement && compatibleVases.length > 0 && (
                <FlowerMixMatch
                  baseProduct={product}
                  options={compatibleVases}
                  mode="flower"
                  user={user}
                  onOptionImageChange={setSelectedOptionImage}
                />
              )}
              {isVase && compatibleArrangements.length > 0 && (
                <FlowerMixMatch
                  baseProduct={product}
                  options={compatibleArrangements}
                  mode="vase"
                  user={user}
                  onOptionImageChange={setSelectedOptionImage}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
