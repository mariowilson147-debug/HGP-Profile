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
    <div className="w-full bg-[#0a0a0a] min-h-[80vh] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif text-[#fefefe] mb-2">Edit Premium Product</h1>
        <p className="text-[#888] text-sm mb-10">Update details and pricing for {product.name}.</p>
        
        <ProductForm initialData={product} />
      </div>
    </div>
  );
}
