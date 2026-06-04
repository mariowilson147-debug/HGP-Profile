"use client";

import CatalogueView from "@/components/app-views/CatalogueView";

export default function AdminCatalogue() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-apex-text">Catalogue</h1>
        <p className="text-apex-on-surface-variant mt-1">Admin Access: View all product availability and pricing.</p>
      </div>
      <CatalogueView returnPath="/admin" />
    </div>
  );
}
