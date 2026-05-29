"use client";

import CatalogueView from "@/components/app-views/CatalogueView";
import { useAuth } from "@/components/AuthProvider";

export default function SellerCatalogue() {
  const { user } = useAuth();
  return <CatalogueView returnPath="/seller" branchId={user?.branch_id} />;
}
