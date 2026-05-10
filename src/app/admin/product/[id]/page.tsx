import ProductForm from "@/components/ProductForm";
import { getProducts } from "@/lib/actions";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const products = await getProducts();
  const product = products.find(p => p.id === id);

  if (!product) {
    notFound();
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      <ProductForm initialData={product} />
    </div>
  );
}

