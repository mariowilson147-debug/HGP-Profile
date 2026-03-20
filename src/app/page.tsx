import ProductGrid from "@/components/ProductGrid";
import { getProducts } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();
  return (
    <div className="w-full min-h-screen bg-[#0f0f0f] py-24">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#1a1a1a]/60 text-xs font-medium text-[#d4af37] uppercase tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.1)]">
            <span>HGP EXCLUSIVES</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-[#fefefe] mb-6 leading-[1.1] drop-shadow-2xl">
            Premium Product Range<span className="text-[#d4af37]">.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#888] font-light leading-relaxed">
            Supplying the finest quality lighting, electronics, bathroom ware, and interior décor for premium buyers and designers.
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mt-8 rounded-full"></div>
        </div>
        
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
