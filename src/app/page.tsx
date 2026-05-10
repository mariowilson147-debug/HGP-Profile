import ProductGrid from "@/components/ProductGrid";
import { getProducts } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();
  return (
    <div className="w-full bg-[#fafafa] flex-1 py-12">
      <ProductGrid products={products} />
    </div>
  );
}
