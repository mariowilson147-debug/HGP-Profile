"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSettings } from "./SettingsProvider";
import { getProducts } from "@/lib/actions";
import LoginModal from "./LoginModal";
import { MapPin, Phone, Mail, Facebook, Instagram } from "lucide-react";

const TikTokIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91.04.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.22-1.15 4.39-2.91 5.76-1.74 1.36-4.04 1.83-6.19 1.36-2.16-.47-4.01-1.89-5.06-3.83-1.05-1.95-1.13-4.32-.23-6.32.9-2.01 2.7-3.55 4.82-4.11 2.11-.56 4.41-.16 6.19 1.11v4.32c-1.17-.89-2.73-1.17-4.12-.76-1.39.41-2.52 1.56-2.95 2.92-.43 1.36-.14 2.87.77 3.96.9 1.09 2.37 1.52 3.75 1.09 1.38-.43 2.39-1.61 2.58-3.03.04-.3.04-.61.04-.92V.02h3.2z" />
  </svg>
);

export default function Footer() {
  const { settings } = useSettings();
  const [categories, setCategories] = useState<string[]>([]);
  const [isStrict, setIsStrict] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  useEffect(() => {
    async function fetchCats() {
      try {
        const params = new URLSearchParams(window.location.search);
        const strictMode = params.get("strict") === "true";
        const catParam = params.get("category");
        setIsStrict(strictMode);

        const products = await getProducts();
        const unique = Array.from(new Set(products.map(p => p.category)));
        
        let cats = unique;
        if (strictMode && catParam) {
          const allowed = catParam.split(',');
          cats = cats.filter(c => allowed.includes(c));
        }
        setCategories(cats.slice(0, 5));
      } catch(e) {}
    }
    fetchCats();
  }, []);

  return (
    <footer className="w-full bg-[#18181b] text-white pt-16 pb-8 px-6 mt-auto relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        
        {/* Left: Logo */}
        <div className="md:w-1/3">
          <Link href="/">
            <span className="font-signature text-5xl font-bold text-white hover:text-slate-200 transition-colors">
              IFS
            </span>
          </Link>
        </div>

        {/* Right: Links Grid */}
        <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-white mb-6 text-sm">Categories</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link href={`/?category=${encodeURIComponent(cat)}${isStrict ? '&strict=true' : ''}`} className="hover:text-white transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && <li className="text-zinc-600">Loading...</li>}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-6 text-sm">Users</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li>
                <button onClick={() => setIsLoginModalOpen(true)} className="hover:text-white transition-colors text-left focus:outline-none">
                  Seller
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-6 text-sm">Connect</h4>
            <div className="flex gap-5">
              <a href="https://www.facebook.com/profile.php?id=61572481348889" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook size={22} />
              </a>
              <a href="https://www.instagram.com/interiorfinishessupermarket/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram size={22} />
              </a>
              <a href="https://www.tiktok.com/@interiorfinishess" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors" aria-label="TikTok">
                <TikTokIcon size={22} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-6 text-sm">Contact Us</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-zinc-300" />
                <span className="leading-relaxed">Meru Makutano, Opp. Checkmate Lounge</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="shrink-0 text-zinc-300" />
                <a href="tel:+254714553218" className="hover:text-white transition-colors">+254 7 14 553218</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0 text-zinc-300" />
                <a href="mailto:prutamenterprise2@gmail.com" className="hover:text-white transition-colors">prutamenterprise2@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom: Copyright & Legal */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
        <div>
          Copyright {new Date().getFullYear()} {settings.companyName || 'Brand'}. All Rights Reserved.
        </div>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        </div>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </footer>
  );
}

