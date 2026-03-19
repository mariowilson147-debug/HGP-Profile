"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getAdminClient = () => {
  if (!supabaseServiceKey || supabaseServiceKey.includes("your_service_role_key_here")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing from .env.local. You must provide a valid Service Role Key to manage users.");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function getUsers() {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error(error.message);
  
  const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
  return data.users.map(u => ({
    id: u.id,
    email: u.email || '',
    role: u.id === ADMIN_UID ? 'admin' : 'wholesale',
    created_at: u.created_at,
  })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createUser(email: string, password: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true 
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function updateUser(id: string, email?: string, password?: string) {
  const supabase = getAdminClient();
  const updates: { email?: string; password?: string } = {};
  if (email) updates.email = email;
  if (password) updates.password = password;
  
  const { data, error } = await supabase.auth.admin.updateUserById(id, updates);
  if (error) throw new Error(error.message);
  return data.user;
}

export async function deleteUser(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  return { success: true };
}
