"use client";

import { useSettings } from "@/components/SettingsProvider";

export default function AboutPage() {
  const { settings } = useSettings();
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-16 font-sans">
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-8">About Us</h1>
      
      <div className="space-y-8 text-slate-600 leading-relaxed text-lg">
        <p>
          Welcome to {settings.companyName}, your premier destination for high-quality electronics, lighting, bathroom ware, and interior décor. We believe in providing top-tier products to elevate spaces and enhance daily experiences.
        </p>
        
        <p>
          Established with the vision to bridge the gap between quality manufacturers and discerning businesses, we have grown into a trusted distribution partner. Our curated catalog reflects a deep understanding of modern aesthetics and functional requirements.
        </p>
        
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Our Mission</h2>
          <p>
            To supply innovative, reliable, and beautifully designed products that empower our clients to build exceptional environments. We are committed to transparency, competitive pricing, and unparalleled customer service.
          </p>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Why Choose Us?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Carefully selected, premium product range</li>
            <li>Real-time catalog and inventory tracking</li>
            <li>Dedicated wholesale support and pricing</li>
            <li>Seamless ordering and fulfillment process</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
