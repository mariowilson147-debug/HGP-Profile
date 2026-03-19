import ProductGrid from "@/components/ProductGrid";
import { getProducts } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const products = await getProducts();
  return (
    <div className="w-full min-h-screen bg-[#0f0f0f] py-24">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-[#222] bg-[#1a1a1a] text-[10px] font-medium text-[#d4af37] uppercase tracking-[0.2em]">
            <span>HGP EXCLUSIVES</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-[#fefefe] mb-6 drop-shadow-lg">Complete Collection</h1>
          <p className="text-[#888] font-light leading-relaxed">Explore our full range of premium products, curated for luxury spaces and architectural distinction.</p>
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mt-8 rounded-full"></div>
        </div>
        
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
