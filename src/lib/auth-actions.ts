"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getAdminClient = () => {
  if (!supabaseServiceKey || supabaseServiceKey.includes("your_service_role_key_here")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing from .env.local. You must provide a valid Service Role Key to manage users."
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserData = {
  id: string;
  email: string;
  role: "admin" | "wholesale";
  created_at: string;
  is_banned: boolean;
};

// ─── List users ───────────────────────────────────────────────────────────────

export async function getUsers(): Promise<UserData[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error(error.message);

  const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

  return data.users
    .map((u) => ({
      id: u.id,
      email: u.email || "",
      role: (u.id === ADMIN_UID ? "admin" : "wholesale") as "admin" | "wholesale",
      created_at: u.created_at,
      // Supabase sets banned_until to a far-future date when banned
      is_banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ─── Create user (default password: seller) ──────────────────────────────────

export async function createUser(email: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "seller",
    email_confirm: true,
    user_metadata: { must_change_password: true },
  });
  if (error) throw new Error(error.message);
  return data.user;
}

// ─── Update user (email / password) ──────────────────────────────────────────

export async function updateUser(id: string, email?: string, password?: string) {
  const supabase = getAdminClient();
  const updates: { email?: string; password?: string } = {};
  if (email) updates.email = email;
  if (password) updates.password = password;

  const { data, error } = await supabase.auth.admin.updateUserById(id, updates);
  if (error) throw new Error(error.message);
  return data.user;
}

// ─── Delete user ──────────────────────────────────────────────────────────────

export async function deleteUser(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// ─── Activate / Suspend user ──────────────────────────────────────────────────

/**
 * ban = true  → suspends the user (ban_duration ~100 years)
 * ban = false → activates the user (removes ban)
 */
export async function toggleUserBan(id: string, ban: boolean) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: ban ? "876600h" : "none",
  });
  if (error) throw new Error(error.message);
  return data.user;
}

// ─── OTP-based password reset ─────────────────────────────────────────────────

/**
 * Sends a 6-digit OTP to the email address.
 * shouldCreateUser: false ensures we only send to existing accounts.
 * NOTE: This runs server-side but calls signInWithOtp which is a public API call.
 * We create a browser-style client with anon key for this operation.
 */
export async function sendOtpCode(email: string) {
  // signInWithOtp is a public API — use anon key client
  const supabase = createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw new Error(error.message);
  return { success: true };
}
