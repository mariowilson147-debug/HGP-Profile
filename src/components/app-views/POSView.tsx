"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Search, Loader2, PackageOpen, Plus, Minus, Trash2, ShoppingCart, CreditCard, CheckCircle2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type POSProduct = {
  id: string;
  name: string;
  category: string;
  sku?: string | null;
  image_url: string;
  retail_price: number;
  stock_level: number;
};

type CartItem = POSProduct & {
  cart_quantity: number;
};

export default function POSView({ branchId, returnPath }: { branchId: string; returnPath: string }) {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();
  
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadPOSInventory() {
      if (!branchId) {
        setLoading(false);
        return;
      }

      // Fetch products that have stock in this branch
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          stock_level,
          products (
            id,
            name,
            category,
            sku,
            image_url,
            retail_price
          )
        `)
        .eq('branch_id', branchId)
        .gt('stock_level', 0); // Only in stock

      if (mounted && data) {
        const mapped = data.map((item: unknown) => {
          const rawItem = item as { stock_level: number; products: unknown };
          const prod = Array.isArray(rawItem.products) ? rawItem.products[0] : rawItem.products;
          return {
            ...(prod as Omit<POSProduct, 'stock_level'>),
            stock_level: rawItem.stock_level
          };
        }) as POSProduct[];
        setProducts(mapped);
        setLoading(false);
      }
    }

    loadPOSInventory();
    return () => { mounted = false };
  }, [branchId, supabase]);

  const addToCart = (product: POSProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cart_quantity >= product.stock_level) return prev; // Cannot exceed stock
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cart_quantity: item.cart_quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, cart_quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.cart_quantity + delta;
        if (newQ > item.stock_level) return item;
        if (newQ <= 0) return { ...item, cart_quantity: 0 }; // Will be filtered out
        return { ...item, cart_quantity: newQ };
      }
      return item;
    }).filter(item => item.cart_quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.retail_price * item.cart_quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || !branchId || !user) return;
    setIsProcessing(true);

    try {
      // 1. Create Sale Record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          branch_id: branchId,
          seller_id: user.id,
          total_amount: total,
          status: 'completed'
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Insert Sale Items
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.cart_quantity,
        unit_price: item.retail_price,
        subtotal: item.retail_price * item.cart_quantity
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      // 3. Deduct Inventory
      for (const item of cart) {
        const { error: rpcError } = await supabase.rpc('decrement_inventory', {
          p_branch_id: branchId,
          p_product_id: item.id,
          p_quantity: item.cart_quantity
        });
        if (rpcError) {
          // Fallback: direct update if RPC doesn't exist yet
          const newStock = item.stock_level - item.cart_quantity;
          await supabase
            .from('inventory')
            .update({ stock_level: newStock })
            .eq('branch_id', branchId)
            .eq('product_id', item.id);
        }
      }

      setSuccess(true);
      setCart([]);
      
      // Reset success message after 3s
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

      // Refresh inventory list (rudimentary refresh)
      const { data: newInventory } = await supabase
        .from('inventory')
        .select('stock_level, products(id, name, category, image_url, retail_price)')
        .eq('branch_id', branchId)
        .gt('stock_level', 0);
        
      if (newInventory) {
        setProducts(newInventory.map((item: unknown) => {
          const rawItem = item as { stock_level: number; products: unknown };
          const prod = Array.isArray(rawItem.products) ? rawItem.products[0] : rawItem.products;
          return {
            ...(prod as Omit<POSProduct, 'stock_level'>),
            stock_level: rawItem.stock_level
          };
        }) as POSProduct[]);
      }

    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Failed to process checkout. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)]">
      
      {/* Left: Products Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="mb-6 flex-shrink-0">
          <Link href={returnPath} className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-display font-bold text-slate-900">Point of Sale</h1>
          </Link>
          <p className="text-slate-500 mt-2">Tap products to add them to the cart.</p>
          
          <div className="relative w-full mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none shadow-sm"
            />
            {search && (
              <button 
                onClick={() => setSearch("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-slate-400 mb-4" size={32} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left flex flex-col active:scale-95"
                >
                  <div className="relative aspect-square bg-slate-50 border-b border-slate-100 p-2">
                    {product.image_url ? (
                      <Image 
                        src={product.image_url} 
                        alt={product.name}
                        fill
                        className="object-contain mix-blend-multiply"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <PackageOpen size={32} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
                      {product.stock_level} in stock
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-display font-bold text-sm text-slate-900 line-clamp-2 leading-tight mb-1">
                      {product.name}
                    </h3>
                    <div className="text-slate-600 font-medium text-xs">
                      KES {product.retail_price?.toLocaleString()}
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-500">
                  No products found in stock.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0 h-full">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <ShoppingCart className="text-slate-500" size={20} />
          <h2 className="font-display font-bold text-lg text-slate-900">Current Order</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <ShoppingCart size={48} strokeWidth={1.5} className="opacity-50" />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.name}</h4>
                    <div className="text-xs text-slate-500 mt-0.5">
                      KES {item.retail_price.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-slate-900">
                      {item.cart_quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={item.cart_quantity >= item.stock_level}
                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-slate-200 text-slate-600 disabled:opacity-50 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-medium">Total</span>
            <span className="text-3xl font-display font-bold text-slate-900 tracking-tight">
              KES {total.toLocaleString()}
            </span>
          </div>

          {success ? (
            <div className="w-full py-4 bg-green-500 text-white rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm animate-in fade-in zoom-in duration-300">
              <CheckCircle2 size={20} />
              Checkout Complete!
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <CreditCard size={20} />
                  Process Checkout
                </>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
