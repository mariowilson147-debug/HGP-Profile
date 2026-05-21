"use client";

import { useState } from "react";
import { Product } from "@/lib/actions";
import { X, Flower2 } from "lucide-react";

interface FlowerMixMatchProps {
  flower: Product;
  compatibleVases: Product[];
  user: { role?: string } | null;
  /** Called with the vase's image_url when a vase is selected, or null when deselected */
  onVaseImageChange?: (imageUrl: string | null) => void;
}

export default function FlowerMixMatch({ flower, compatibleVases, user, onVaseImageChange }: FlowerMixMatchProps) {
  const [selectedVase, setSelectedVase] = useState<Product | null>(null);

  const selectVase = (vase: Product | null) => {
    setSelectedVase(vase);
    onVaseImageChange?.(vase ? vase.image_url : null);
  };

  if (compatibleVases.length === 0) return null;

  const stemPrice = parseFloat(String(flower.attributes?.stem_price || "0")) || 0;
  const vasePrice = selectedVase ? (selectedVase.retail_price || 0) : 0;
  const combinedPrice = stemPrice + vasePrice;

  const vasePriceWholesale = selectedVase ? (selectedVase.wholesale_price || 0) : 0;
  const combinedWholesale = stemPrice + vasePriceWholesale;

  const isAdmin = user?.role === "admin";

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <Flower2 size={15} className="text-pink-400" />
        <span className="text-sm font-semibold text-slate-700">Try in a different vase</span>
        <span className="ml-auto text-[10px] text-slate-400 font-medium">
          {compatibleVases.length} option{compatibleVases.length !== 1 ? "s" : ""} available
        </span>
      </div>

      {/* Selected vase indicator */}
      {selectedVase && (
        <div className="flex items-center gap-2 mb-3 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedVase.image_url}
            alt={selectedVase.name}
            className="w-8 h-8 rounded-lg object-cover border border-pink-200"
          />
          <span className="text-xs font-semibold text-pink-700 flex-1">
            Viewing with: {selectedVase.name}
          </span>
          <button
            onClick={() => selectVase(null)}
            className="text-pink-400 hover:text-pink-600 transition-colors"
            aria-label="Remove vase selection"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Vase chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {compatibleVases.map((vase) => {
          const active = selectedVase?.id === vase.id;
          return (
            <button
              key={vase.id}
              onClick={() => selectVase(active ? null : vase)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 group
                ${active
                  ? "border-pink-400 bg-pink-50 shadow-md shadow-pink-100"
                  : "border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50/50"
                }`}
              aria-label={`Select vase: ${vase.name}`}
              title={vase.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vase.image_url}
                alt={vase.name}
                className={`w-14 h-14 object-cover rounded-lg transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`}
              />
              <span className={`text-[9px] font-bold text-center leading-tight max-w-[56px] truncate transition-colors ${active ? "text-pink-600" : "text-slate-500 group-hover:text-pink-500"}`}>
                {vase.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Price breakdown — only shown to logged-in users */}
      {user && selectedVase && (
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Price Breakdown</p>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600">Flower stem alone</span>
              {stemPrice > 0 ? (
                <span className="font-semibold text-slate-800">KES {stemPrice.toLocaleString()}</span>
              ) : (
                <span className="text-slate-400 italic">—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Vase ({selectedVase.name})</span>
              <span className="font-semibold text-slate-800">
                KES {(isAdmin ? vasePriceWholesale : vasePrice).toLocaleString()}
                {isAdmin && <span className="text-[9px] text-slate-400 ml-1">ws</span>}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between">
              <span className="font-bold text-slate-700">Combined total</span>
              <span className="font-bold text-slate-900">
                KES {(isAdmin ? combinedWholesale : combinedPrice).toLocaleString()}
                {isAdmin && <span className="text-[9px] text-slate-400 ml-1">ws</span>}
              </span>
            </div>
            {isAdmin && (
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Retail combined</span>
                <span>KES {combinedPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest prompt */}
      {!user && (
        <p className="mt-3 text-[11px] text-slate-500 text-center">
          Contact Sales to order your preferred flower + vase combination.
        </p>
      )}
    </div>
  );
}
