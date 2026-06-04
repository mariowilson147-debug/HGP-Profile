"use client";

import { useState } from "react";
import { Product } from "@/lib/actions";
import { X, Flower2 } from "lucide-react";

interface FlowerMixMatchProps {
  baseProduct: Product;
  options: Product[];
  mode: 'flower' | 'vase';
  user: { role?: string } | null;
  /** Called with the option's image_url when selected, or null when deselected */
  onOptionImageChange?: (imageUrl: string | null) => void;
}

export default function FlowerMixMatch({ baseProduct, options, mode, user, onOptionImageChange }: FlowerMixMatchProps) {
  const [selectedOption, setSelectedOption] = useState<Product | null>(null);

  const selectOption = (option: Product | null) => {
    setSelectedOption(option);
    onOptionImageChange?.(option ? option.image_url : null);
  };

  if (options.length === 0) return null;

  const stemProduct = mode === 'flower' ? baseProduct : selectedOption;
  const vaseProduct = mode === 'flower' ? selectedOption : baseProduct;

  const stemPrice = stemProduct?.retail_price || 0;
  const stemPriceWholesale = stemProduct?.wholesale_price || 0;

  const vasePrice = vaseProduct?.retail_price || 0;
  const vasePriceWholesale = vaseProduct?.wholesale_price || 0;

  const combinedPrice = selectedOption ? stemPrice + vasePrice : 0;
  const combinedWholesale = selectedOption ? stemPriceWholesale + vasePriceWholesale : 0;

  const isAdmin = user?.role === "admin";

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <Flower2 size={15} className={mode === 'flower' ? "text-pink-400" : "text-amber-500"} />
        <span className="text-sm font-semibold text-slate-700">
          {mode === 'flower' ? "Try in a different vase" : "Try with a flower arrangement"}
        </span>
        <span className="ml-auto text-[10px] text-slate-400 font-medium">
          {options.length} option{options.length !== 1 ? "s" : ""} available
        </span>
      </div>

      {/* Selected option indicator */}
      {selectedOption && (
        <div className="flex items-center gap-2 mb-3 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedOption.image_url}
            alt={selectedOption.name}
            className="w-8 h-8 rounded-lg object-cover border border-pink-200"
          />
          <span className="text-xs font-semibold text-pink-700 flex-1">
            Viewing with: {selectedOption.name}
          </span>
          <button
            onClick={() => selectOption(null)}
            className="text-pink-400 hover:text-pink-600 transition-colors"
            aria-label="Remove selection"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Option chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {options.map((opt) => {
          const active = selectedOption?.id === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => selectOption(active ? null : opt)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 group
                ${active
                  ? "border-pink-400 bg-pink-50 shadow-md shadow-pink-100"
                  : "border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50/50"
                }`}
              aria-label={`Select option: ${opt.name}`}
              title={opt.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={opt.image_url}
                alt={opt.name}
                className={`w-14 h-14 object-cover rounded-lg transition-transform duration-300 ${active ? "scale-105" : "group-hover:scale-105"}`}
              />
              <span className={`text-[9px] font-bold text-center leading-tight max-w-[56px] truncate transition-colors ${active ? "text-pink-600" : "text-slate-500 group-hover:text-pink-500"}`}>
                {opt.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Price breakdown — only shown to logged-in users */}
      {user && selectedOption && (
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Price Breakdown</p>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600">Flower stem ({stemProduct?.name})</span>
              {stemPrice > 0 ? (
                <span className="font-semibold text-slate-800">
                  KES {(isAdmin ? stemPriceWholesale : stemPrice).toLocaleString()}
                  {isAdmin && <span className="text-[9px] text-slate-400 ml-1">ws</span>}
                </span>
              ) : (
                <span className="text-slate-400 italic">—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Vase ({vaseProduct?.name})</span>
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
