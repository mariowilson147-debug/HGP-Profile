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

// ─── Password reset via admin generateLink ────────────────────────────────────

/**
 * Validates the email belongs to an existing account, then triggers
 * Supabase's built-in "Reset Password" email via admin.generateLink.
 *
 * The email Supabase sends contains {{ .Token }} — the 6-digit OTP code.
 * To show ONLY the code (no magic link) in the email, update the
 * "Reset Password" template in Supabase Dashboard → Auth → Email Templates:
 *   Subject: Your password reset code
 *   Body:    Your verification code is: {{ .Token }}
 *            (Valid for 60 minutes. Do not share this code.)
 *
 * The client verifies with: supabase.auth.verifyOtp({ email, token, type: 'recovery' })
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean }> {
  const supabase = getAdminClient();

  // Step 1: confirm the account exists
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw new Error("Unable to verify account. Please try again.");

  const exists = listData.users.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!exists) {
    throw new Error("No account found with this email address.");
  }

  // Step 2: generate a recovery link — Supabase automatically sends the
  // "Reset Password" email which includes {{ .Token }} (the 6-digit code).
  const { error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (linkError) throw new Error(linkError.message);
  return { success: true };
}
