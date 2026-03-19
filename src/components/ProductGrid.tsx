"use client";

import { useState } from "react";
import ProductModal, { Product } from "./ProductModal";
import { useAuth } from "./AuthProvider";

export default function ProductGrid({ products }: { products: Product[] }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { user } = useAuth();
  const isLoggedIn = !!user;

  if (products.length === 0) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-[#888]">
        <h3 className="text-xl font-serif text-[#e0e0e0] mb-2">No Products Found</h3>
        <p className="text-sm">There are currently no products in this category.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
        {products.map((product) => (
          <div 
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className="group cursor-pointer flex flex-col"
          >
            <div className="relative aspect-square mb-6 overflow-hidden bg-[#0a0a0a] border border-[#222] rounded-sm group-hover:border-[#d4af37]/50 transition-colors duration-500 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#000]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                <span className="text-[#d4af37] text-xs font-medium uppercase tracking-[0.2em] border border-[#d4af37]/50 px-4 py-2 bg-[#000]/50 backdrop-blur-sm w-full text-center">
                  View Details
                </span>
              </div>
            </div>
            <div className="flex flex-col text-center px-4">
              <span className="text-[#888] text-[10px] uppercase tracking-[0.2em] mb-3">{product.category}</span>
              <h3 className="font-serif text-xl text-[#e0e0e0] group-hover:text-[#d4af37] transition-colors">{product.name}</h3>
            </div>
          </div>
        ))}
      </div>

      <ProductModal 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
