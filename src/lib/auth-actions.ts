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

import { createSupabaseServerClient } from "./supabase/server";

export async function updateMyProfile(nickname: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const adminClient = getAdminClient();
  const { error } = await adminClient.from('user_profiles').update({ nickname }).eq('id', session.user.id);
  
  if (error) throw new Error(error.message);
  return true;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserData = {
  id: string;
  email: string;
  role: string;
  branch_id?: string | null;
  assigned_branches?: string[] | null;
  nickname?: string | null;
  created_at: string;
  is_banned: boolean;
};

export type BranchData = {
  id: string;
  name: string;
};

// ─── List users ───────────────────────────────────────────────────────────────

export async function getUsers(): Promise<UserData[]> {
  const supabase = getAdminClient();
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) throw new Error(authError.message);

  const { data: profileData, error: profileError } = await supabase.from('user_profiles').select('*');
  if (profileError) throw new Error(profileError.message);

  const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

  return authData.users
    .map((u) => {
      const profile = profileData?.find(p => p.id === u.id);
      return {
        id: u.id,
        email: u.email || "",
        role: profile?.role || (u.id === ADMIN_UID ? "admin" : "wholesale"),
        branch_id: profile?.branch_id || null,
        assigned_branches: profile?.assigned_branches || null,
        nickname: profile?.nickname || null,
        created_at: u.created_at,
        is_banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getBranches(): Promise<BranchData[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('branches').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
}

// ─── Create user (default password: seller) ──────────────────────────────────

export async function createUser(email: string, role: string = 'wholesale', branch_id: string | null = null, assigned_branches: string[] | null = null) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "seller",
    email_confirm: true,
    user_metadata: { must_change_password: true },
  });
  if (error) throw new Error(error.message);
  
  if (data?.user) {
    await supabase.from('user_profiles').insert([{
      id: data.user.id,
      role,
      branch_id,
      assigned_branches
    }]);
  }
  return data.user;
}

// ─── Update user (email / password) ──────────────────────────────────────────

export async function updateUser(id: string, email?: string, password?: string, role?: string, branch_id?: string | null, assigned_branches?: string[] | null) {
  const supabase = getAdminClient();
  const updates: { email?: string; password?: string } = {};
  if (email) updates.email = email;
  if (password) updates.password = password;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.auth.admin.updateUserById(id, updates);
    if (error) throw new Error(error.message);
  }

  if (role || branch_id !== undefined || assigned_branches !== undefined) {
    const { data: currentProfile } = await supabase.from('user_profiles').select('role, branch_id, assigned_branches').eq('id', id).single();
    
    const payload = {
      id,
      role: role || currentProfile?.role || 'wholesale',
      branch_id: branch_id !== undefined ? (branch_id || null) : currentProfile?.branch_id,
      assigned_branches: assigned_branches !== undefined ? (assigned_branches || null) : currentProfile?.assigned_branches
    };
    
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(payload);
    if (profileError) throw new Error(profileError.message);
  }
  
  return { success: true };
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

// ─── Password reset — validate user exists, then send recovery email ─────────

/**
 * Step 1: Confirm the account exists using the admin client.
 * Step 2: Call resetPasswordForEmail which actually sends Supabase's
 *         built-in "Reset Password" email (uses the template you set).
 *         The template must contain {{ .Token }} to show the 6-digit code.
 *
 * Client verifies with: supabase.auth.verifyOtp({ email, token, type: 'recovery' })
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();

    // Validate the account exists
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return { success: false, error: "Unable to verify account. Please try again." };

    const exists = listData.users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (!exists) return { success: false, error: "No account found with this email address." };

    // resetPasswordForEmail actually sends the email (unlike generateLink which doesn't).
    // It uses Supabase's built-in SMTP and the "Reset Password" email template.
    // Since the template now shows {{ .Token }}, the user receives the 6-digit code.
    const publicClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await publicClient.auth.resetPasswordForEmail(email);
    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "An unexpected error occurred." };
  }
}
