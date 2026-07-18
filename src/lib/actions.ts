"use server";

import { createSupabaseServerClient } from "./supabase/server";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import os from "os";

// Admin client bypasses RLS for system operations like chat messages
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type Product = {
  id: string;
  name: string;
  category: string;
  sku?: string | null;
  image_url: string;
  buying_price: number;
  wholesale_price: number;
  retail_price: number;
  visibility: 'visible' | 'hidden' | 'archived';
  is_featured: boolean;
  tags: string[];
  attributes: Record<string, string | string[]>;
  availability: 'in_stock' | 'out_of_stock' | 'coming_soon';
  sort_order: number;
  created_at?: string;
};

export type Category = {
  id: string;
  name: string;
  sku_prefix: string;
  icon_name: string | null;
  parent_id: string | null;
  is_featured: boolean;
  is_visible: boolean;
  banner_url: string | null;
  sort_order: number;
  created_at?: string;
};

export type StoreSettings = {
  id: number;
  company_name: string;
  theme: string;
  accent_color: string;
  whatsapp_number: string | null;
  enable_whatsapp: boolean;
  inquiry_auto_reply: string | null;
  media_watermark_enabled: boolean;
  updated_at?: string;
};

// Check for Server Side Authorized action
async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id !== process.env.NEXT_PUBLIC_ADMIN_UID) {
    throw new Error("Unauthorized request. Only the designated Admin can perform this action.");
  }
  return supabase;
}

export const getProducts = unstable_cache(
  async () => {
    // Use anon client without cookies so it can be fully cached
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }
    
    const products = data || [];
    return products.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  },
  ['products-cache'],
  { tags: ['products'] }
);

export async function addProduct(product: Omit<Product, "id" | "created_at">) {
  const supabase = await requireAdmin();

  const { data: existing } = await supabase.from('products').select('name').ilike('name', product.name);
  if (existing && existing.length > 0) {
    return { error: `A product with the name "${product.name}" already exists.` };
  }

  const { data, error } = await supabase.from('products').insert([product]).select().single();
  if (error) {
    console.error("Insert error", error);
    return { error: error.message };
  }
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  revalidateTag("products");
  return { success: true, count: 1, data };
}

export async function addProducts(products: Omit<Product, "id" | "created_at">[]) {
  const supabase = await requireAdmin();

  // Check for duplicates using ilike for case-insensitive match
  // Supabase 'in' operator isn't case-insensitive directly, so we'll fetch existing names that match any
  const names = products.map(p => p.name);
  const { data: existing } = await supabase.from('products').select('name').in('name', names);
  if (existing && existing.length > 0) {
    const dupes = existing.map(e => e.name).join(", ");
    return { error: `Duplicate product names found in database: ${dupes}` };
  }

  const { data, error } = await supabase.from('products').insert(products).select();
  if (error) {
    console.error("Bulk insert error", error);
    return { error: error.message };
  }
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  revalidateTag("products");
  return { success: true, count: data?.length ?? products.length, data };
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const supabase = await requireAdmin();

  if (updates.name) {
    const { data: existing } = await supabase.from('products').select('id, name').ilike('name', updates.name).neq('id', id);
    if (existing && existing.length > 0) {
      return { error: `A product with the name "${updates.name}" already exists.` };
    }
  }

  // If we are updating the image_url, we should check what the old image was so we can delete it
  let oldImageUrl: string | undefined;
  if (updates.image_url) {
    const { data: oldProduct } = await supabase.from('products').select('image_url').eq('id', id).single();
    if (oldProduct?.image_url && oldProduct.image_url !== updates.image_url) {
      oldImageUrl = oldProduct.image_url;
    }
  }

  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
  if (error) {
    return { error: error.message };
  }

  // Delete old image if it was replaced
  if (oldImageUrl) {
    try {
      const urlParts = oldImageUrl.split('/public/images/');
      if (urlParts.length === 2) {
        const path = urlParts[1];
        await supabase.storage.from('images').remove([path]);
      }
    } catch (err) {
      console.error("Failed to delete orphaned image:", err);
    }
  }

  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  revalidateTag("products");
  return { success: true, count: 1, data };
}

export async function updateProductCategoryName(oldName: string, newName: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('products').update({ category: newName }).eq('category', oldName);
  if (error) {
    console.error("Error updating category name:", error);
    return { error: error.message };
  }
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  revalidateTag("products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();

  // Get the product to find the image URL
  const { data: product } = await supabase.from('products').select('image_url').eq('id', id).single();

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    return { error: error.message };
  }

  // If product deleted successfully, delete image from storage
  if (product?.image_url) {
    try {
      const urlParts = product.image_url.split('/public/images/');
      if (urlParts.length === 2) {
        const path = urlParts[1];
        await supabase.storage.from('images').remove([path]);
      }
    } catch (err) {
      console.error("Failed to delete orphaned image:", err);
    }
  }

  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  revalidateTag("products");
  return { success: true };
}

// --- Categories Actions ---

export const getDbCategories = unstable_cache(
  async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
    return data as Category[];
  },
  ['categories-cache'],
  { tags: ['categories'] }
);

export async function addDbCategory(category: Omit<Category, "id" | "created_at">) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.from('categories').insert([category]).select().single();
  if (error) return { error: error.message };
  revalidateTag("categories");
  return { success: true, data };
}

export async function updateDbCategory(id: string, updates: Partial<Category>) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
  if (error) return { error: error.message };
  revalidateTag("categories");
  return { success: true, data };
}

export async function deleteDbCategory(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidateTag("categories");
  return { success: true };
}

export async function syncCategoriesFromProducts() {
  const supabase = await requireAdmin();
  
  // 1. Get all unique categories from products
  const { data: products, error: pError } = await supabase.from('products').select('category');
  if (pError) return { error: pError.message };
  
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(c => c && c.trim() !== "")));
  
  // 2. Get existing categories
  const { data: existing, error: eError } = await supabase.from('categories').select('name');
  if (eError) return { error: eError.message };
  
  const existingNames = new Set(existing.map(c => c.name));
  
  // 3. Find missing ones
  const missing = uniqueCategories.filter(c => !existingNames.has(c));
  
  if (missing.length > 0) {
    const payloads = missing.map((name, index) => ({
      name,
      sku_prefix: name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, ''),
      icon_name: 'Package',
      is_visible: true,
      is_featured: false,
      sort_order: existing.length + index
    }));
    
    const { error: insertError } = await supabase.from('categories').insert(payloads);
    if (insertError) return { error: insertError.message };
  }
  
  // Force cache invalidation
  revalidateTag('categories');
  revalidatePath('/');
  revalidatePath('/admin');
  
  // Return updated full list
  const { data: finalData } = await supabase.from('categories').select('*').order('sort_order');
  return { success: true, count: missing.length, data: finalData as Category[] };
}

export async function deleteEmptyCategories() {
  const supabase = await requireAdmin();
  
  // 1. Get all products to see which categories are in use
  const { data: products, error: pError } = await supabase.from('products').select('category');
  if (pError) return { error: pError.message };
  
  const activeCategoryNames = new Set(products.map(p => p.category).filter(Boolean));
  
  // 2. Get all existing categories
  const { data: existing, error: eError } = await supabase.from('categories').select('id, name');
  if (eError) return { error: eError.message };
  
  // 3. Find empty ones
  const emptyCategories = existing.filter(c => !activeCategoryNames.has(c.name));
  console.log("Active categories:", Array.from(activeCategoryNames));
  console.log("Existing categories:", existing);
  console.log("Empty categories found:", emptyCategories);
  
  if (emptyCategories.length > 0) {
    const emptyIds = emptyCategories.map(c => c.id);
    const { error: deleteError } = await supabase.from('categories').delete().in('id', emptyIds);
    if (deleteError) return { error: deleteError.message };
  }
  
  // Force cache invalidation
  revalidateTag('categories');
  revalidatePath('/');
  revalidatePath('/admin');
  
  // Return updated full list
  const { data: finalData } = await supabase.from('categories').select('*').order('sort_order');
  return { success: true, count: emptyCategories.length, data: finalData as Category[] };
}

// --- Flowers Actions ---

export async function ensureFlowersCategory() {
  const supabase = await requireAdmin();
  const { data: existing } = await supabase.from('categories').select('id').eq('name', 'Flowers & Vases').maybeSingle();
  if (existing) return { success: true, created: false };

  const { error } = await supabase.from('categories').insert([{
    name: 'Flowers & Vases',
    sku_prefix: 'FLW',
    icon_name: 'Flower2',
    is_featured: true,
    is_visible: true,
    sort_order: 0,
    parent_id: null,
    banner_url: null,
  }]);
  if (error) return { error: error.message };
  revalidateTag('categories');
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true, created: true };
}

export const getFlowerVaseProducts = unstable_cache(
  async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'Flowers & Vases');
    if (error) return [];
    // Filter to only vase-type products client-side (attributes is JSONB)
    return (data || []).filter((p) => p.attributes?.component_type === 'vase') as Product[];
  },
  ['flower-vases-cache'],
  { tags: ['products', 'flower-vases'] }
);

// --- Store Settings Actions ---

export const getStoreSettings = unstable_cache(
  async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single();
    if (error) {
      console.error("Error fetching store settings:", error);
      return null;
    }
    return data as StoreSettings;
  },
  ['store-settings-cache'],
  { tags: ['store_settings'] }
);

export async function updateStoreSettings(updates: Partial<StoreSettings>) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.from('store_settings').update(updates).eq('id', 1).select().single();
  if (error) return { error: error.message };
  revalidateTag("store_settings");
  return { success: true, data };
}

// --- Analytics Actions ---

export async function logProductView(productId: string, sessionId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  await supabase.from('product_views').insert([{ product_id: productId, session_id: sessionId }]);
}

export async function logSearchQuery(query: string, sessionId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  await supabase.from('search_analytics').insert([{ query, session_id: sessionId }]);
}

export async function getAnalyticsSummary() {
  const supabase = await requireAdmin();
  // Fetch views
  const { count: totalViews } = await supabase.from('product_views').select('*', { count: 'exact', head: true });
  // You would typically group by here, but for simplicity we return the total
  return { totalViews };
}

export async function sendMessage(message: { session_id?: string; name: string; email: string; content: string; is_admin_reply?: boolean }) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from('messages').insert([
    { 
      session_id: message.session_id || 'anonymous',
      name: message.name, 
      email: message.email, 
      content: message.content,
      is_admin_reply: message.is_admin_reply || false
    }
  ]);
  
  if (error) {
    console.error("Message insert error", error);
    throw new Error(error.message);
  }
  
  return { success: true };
}

export async function getMessagesBySession(session_id: string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from('messages')
    .select('*')
    .eq('session_id', session_id)
    .order('created_at', { ascending: true });
    
  if (error) return [];
  return data;
}

export async function getChatThreads() {
  await requireAdmin(); // Ensure the caller is an admin
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from('messages')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) return [];
  
  const threads = new Map();
  for (const msg of data) {
    if (!msg.session_id) continue;
    if (!threads.has(msg.session_id)) {
      threads.set(msg.session_id, {
        session_id: msg.session_id,
        name: msg.name,
        email: msg.email,
        last_message: msg.content,
        updated_at: msg.created_at,
        has_unread: !msg.is_admin_reply
      });
    }
  }
  return Array.from(threads.values());
}

export async function getSystemMetrics() {
  try {
    const uptime = os.uptime();
    const d = Math.floor(uptime / (3600 * 24));
    const h = Math.floor((uptime % (3600 * 24)) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const uptimeStr = `${d.toString().padStart(3, '0')}:${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    const load = os.loadavg()[0];
    const cpus = os.cpus().length;
    const loadPercent = ((load / cpus) * 100).toFixed(1);
    
    let dbRegion = "LOCAL_VAULT_01";
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
        dbRegion = url.hostname.split('.')[0].toUpperCase();
      } catch(e) {}
    }

    return {
      uptimeStr,
      loadPercent,
      threadCount: cpus * 2 + 4,
      dbRegion
    };
  } catch (e) {
    return {
      uptimeStr: "000:00:00:00",
      loadPercent: "0.0",
      threadCount: 1,
      dbRegion: "UNKNOWN"
    };
  }
}
// --- Branches ---

export async function createBranch(name: string, location: string | null) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from('branches').insert([{ name, location }]).select().single();
  if (error) throw error;
  revalidatePath('/admin/branches');
  return data;
}

export async function updateBranch(id: string, name: string, location: string | null) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from('branches').update({ name, location }).eq('id', id).select().single();
  if (error) throw error;
  revalidatePath('/admin/branches');
  return data;
}

export async function deleteBranch(id: string) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from('branches').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/branches');
}

export type InventoryAdjustment = {
  id?: string;
  branch_id: string;
  product_id: string;
  manager_id: string;
  old_stock: number;
  new_stock: number;
  difference: number;
  reason: string;
  created_at?: string;
};

export async function createAdjustment(adjustment: InventoryAdjustment, inventoryId: string | null) {
  const supabase = getAdminSupabase();

  const { error } = await supabase.rpc('apply_inventory_adjustment', {
    p_branch_id: adjustment.branch_id,
    p_product_id: adjustment.product_id,
    p_manager_id: adjustment.manager_id,
    p_new_stock: adjustment.new_stock,
    p_reason: adjustment.reason,
    p_inventory_id: inventoryId,
  });

  if (error) throw error;
}

export async function getAdjustmentHistory(branchId: string, fromDate?: Date, toDate?: Date) {
  const supabase = getAdminSupabase();
  let query = supabase
    .from('inventory_adjustments')
    .select(`
      id,
      old_stock,
      new_stock,
      difference,
      reason,
      created_at,
      manager_id,
      products (
        name,
        sku,
        image_url
      )
    `)
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false });

  if (fromDate) {
    query = query.gte('created_at', fromDate.toISOString());
  }
  if (toDate) {
    const endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.lte('created_at', endOfDay.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Fetch user names for the managers
  if (data && data.length > 0) {
    const managerIds = [...new Set(data.map((d: Record<string, unknown>) => d.manager_id as string))];
    const { data: usersData } = await supabase.from('users').select('id, full_name').in('id', managerIds);
    
    if (usersData) {
      const userMap = usersData.reduce((acc: Record<string, string>, user: Record<string, unknown>) => {
        acc[user.id as string] = user.full_name as string;
        return acc;
      }, {});
      
      return data.map((d: Record<string, unknown>) => ({
        ...d,
        manager_name: userMap[d.manager_id as string] || 'Unknown User'
      }));
    }
  }
  
  return data || [];
}

export async function reverseSale(saleId: string) {
  const supabase = getAdminSupabase();

  const { error } = await supabase.rpc('reverse_sale_inventory', {
    p_sale_id: saleId,
  });

  if (error) {
    return { error: error.message || "Sale not found or already reversed." };
  }

  revalidatePath("/admin/sessions");
  revalidatePath("/manager/sessions");
  revalidatePath("/seller/sales");
  return { success: true };
}

