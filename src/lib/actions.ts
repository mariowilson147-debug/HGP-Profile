"use server";

import { createSupabaseServerClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

export type Product = {
  id: string;
  name: string;
  category: string;
  image_url: string;
  buying_price: number;
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
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  
  const products = data || [];
  return products.sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
}

export async function addProduct(product: Omit<Product, "id" | "created_at">) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.from('products').insert([product]).select().single();
  if (error) {
    console.error("Insert error", error);
    return { error: error.message };
  }
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  return { success: true, count: 1, data };
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  return { success: true, count: 1, data };
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  return { success: true };
}

export async function sendMessage(message: { session_id?: string; name: string; email: string; content: string; is_admin_reply?: boolean }) {
  const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('messages')
    .select('*')
    .eq('session_id', session_id)
    .order('created_at', { ascending: true });
    
  if (error) return [];
  return data;
}

export async function getChatThreads() {
  const supabase = await requireAdmin();
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
