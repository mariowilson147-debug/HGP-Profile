import Link from "next/link";
import { ArrowRight, Lightbulb, Tv, Bath, Armchair } from "lucide-react";

export default function Home() {
  const categories = [
    { name: "Lighting", icon: Lightbulb, href: "/catalog/lighting", desc: "Premium chandeliers & modern fixtures" },
    { name: "Electronics", icon: Tv, href: "/catalog/electronics", desc: "High-end AV & smart accessories" },
    { name: "Bathroom", icon: Bath, href: "/catalog/bathroom", desc: "Luxury tapware & ceramics" },
    { name: "Interior", icon: Armchair, href: "/catalog/interior", desc: "Exclusive décor & furnishings" },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full min-h-[70vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Abstract dark/gold background mesh or gradient */}
        <div className="absolute inset-0 z-0 opacity-[0.15] bg-[radial-gradient(circle_at_center,_#d4af37_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#0f0f0f]/50 to-[#0f0f0f]"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-16">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#1a1a1a]/60 text-xs font-medium text-[#d4af37] uppercase tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.1)]">
            <span>Wholesale Digital Showroom</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif text-[#fefefe] mb-6 leading-[1.1] drop-shadow-2xl">
            Premium Product Range<span className="text-[#d4af37]">.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#888] mb-12 max-w-2xl font-light leading-relaxed">
            Supplying the finest quality lighting, electronics, bathroom ware, and interior décor for high-end wholesale buyers and designers.
          </p>
          
          <Link href="/catalog" className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#0a0a0a] border border-[#d4af37]/50 text-[#d4af37] overflow-hidden rounded-sm transition-all duration-500 hover:border-[#d4af37] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <span className="relative z-10 font-medium tracking-widest uppercase text-sm">Explore Collection</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </Link>
        </div>
      </section>

      {/* Category Section */}
      <section className="w-full py-24 bg-[#0a0a0a] border-t border-[#222]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-[#fefefe] mb-4 tracking-wide">Our Collections</h2>
              <div className="w-20 h-1 bg-[#d4af37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
            </div>
            <Link href="/catalog" className="text-sm uppercase tracking-widest font-medium text-[#888] hover:text-[#d4af37] transition-colors flex items-center gap-2 group">
              View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.name} href={category.href} className="group block h-full">
                <div className="relative h-full p-8 border border-[#222] bg-[#0f0f0f] rounded-sm transition-all duration-500 hover:border-[#d4af37] hover:shadow-[0_0_25px_rgba(212,175,55,0.15)] hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
                  <div className="absolute -top-10 -right-10 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-700 pointer-events-none">
                    <category.icon size={180} />
                  </div>
                  
                  <div className="relative z-10 mb-12">
                    <div className="w-14 h-14 rounded-full border border-[#333] flex items-center justify-center mb-8 group-hover:border-[#d4af37] group-hover:bg-[#d4af37]/10 transition-colors bg-[#0a0a0a]">
                      <category.icon size={24} className="text-[#888] group-hover:text-[#d4af37] transition-colors" />
                    </div>
                    <h3 className="text-2xl font-serif text-[#e0e0e0] mb-3 group-hover:text-[#fefefe] transition-colors">{category.name}</h3>
                    <p className="text-sm text-[#888] group-hover:text-[#aaa] transition-colors leading-relaxed">{category.desc}</p>
                  </div>
                  
                  <div className="relative z-10 flex border-t border-[#222] pt-5 mt-auto group-hover:border-[#d4af37]/30 transition-colors">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                       Explore <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
