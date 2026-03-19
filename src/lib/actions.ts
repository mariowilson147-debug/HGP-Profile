"use server";

import { createSupabaseServerClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

export type Product = {
  id: string;
  name: string;
  category: string;
  image_url: string;
  wholesale_price: number;
  retail_price: number;
  created_at?: string;
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

export async function getProducts() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return data || [];
}

export async function addProduct(product: Omit<Product, "id" | "created_at">) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.from('products').insert([product]).select().single();
  if (error) {
    console.error("Insert error", error);
    throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  return data;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  return data;
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  return { success: true };
}
