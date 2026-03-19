import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="w-full bg-[#0a0a0a] min-h-[80vh] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif text-[#fefefe] mb-2">Publish Premium Product</h1>
        <p className="text-[#888] text-sm mb-10">Add a new item to the digital wholesale catalog.</p>
        
        <ProductForm />
      </div>
    </div>
  );
}
