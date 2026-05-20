"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShieldCheck, Award, Zap } from "lucide-react";
import { User } from "@/components/AuthProvider";
import { useChat } from "./ChatProvider";
import { useSettings } from "./SettingsProvider";

import { Product } from "@/lib/actions";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function ProductModal({ product, isOpen, onClose, user }: ProductModalProps) {
  const { openChat } = useChat();
  const { settings } = useSettings();

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
            <div className="w-full relative bg-[#EAEAEA] flex items-start justify-center pt-16 pb-12 px-12 h-[350px] overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center text-slate-800 hover:text-slate-500 transition-colors"
              >
                <X size={24} />
              </button>

              <button className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-slate-800 hover:text-red-500 transition-colors">
                <Heart size={22} />
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image_url} alt={product.name} className="w-full h-auto mix-blend-multiply drop-shadow-md max-w-[280px] my-auto" />
            </div>

            {/* Bottom Details Section */}
            <div className="w-full bg-[#F3F3F3] px-8 py-8 flex flex-col">
              <h2 className="text-2xl font-display text-slate-900 mb-8 font-normal">
                {product.name}
              </h2>

              {/* Pricing & Actions */}
              <div className="mt-auto flex items-end justify-between gap-4">
                {user ? (
                  <div className="flex flex-col gap-1">
                    {user.role === 'admin' && (
                      <div className="text-[10px] text-slate-500 font-medium mb-1">
                        Cost: KES {product.buying_price?.toLocaleString()}
                      </div>
                    )}
                    <div className="text-sm font-medium text-slate-500">Retail: KES {product.retail_price?.toLocaleString()}</div>
                    <div className="text-3xl font-display font-medium text-slate-900 tracking-tight">
                      KES {product.wholesale_price?.toLocaleString()} <span className="text-sm font-normal text-slate-500">ws</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-medium text-slate-900">Request Quote</h3>
                  </div>
                )}

                {!user && (
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
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

