"use server";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getAdminClient = () => {
  if (!supabaseServiceKey || supabaseServiceKey.includes("your_service_role_key_here")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing from .env.local.");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

/**
 * Creates a new user specifically assigned to a branch, limiting roles to seller or wholesale.
 * Only authenticated managers/admins can call this.
 */
export async function createStaffUser(email: string, role: string, branch_id: string, nickname?: string) {
  if (role !== "seller" && role !== "wholesale") {
    throw new Error("Managers can only create sellers or wholesale buyers.");
  }

  // 1. Verify caller is a manager and has access to this branch
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const adminClient = getAdminClient();
  
  const { data: callerProfile } = await adminClient
    .from('user_profiles')
    .select('role, assigned_branches')
    .eq('id', session.user.id)
    .single();

  if (!callerProfile || (callerProfile.role !== 'manager' && callerProfile.role !== 'admin' && callerProfile.role !== 'ceo')) {
    throw new Error("Unauthorized: Must be a manager");
  }

  // If manager, check if they are assigned to this branch
  if (callerProfile.role === 'manager') {
    const branches = callerProfile.assigned_branches || [];
    if (!branches.includes(branch_id)) {
      throw new Error("Unauthorized: You do not manage this branch.");
    }
  }

  // 2. Create the user in Auth
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: "seller", // Default password
    email_confirm: true,
    user_metadata: { must_change_password: true },
  });
  if (error) throw new Error(error.message);
  
  // 3. Create user profile
  if (data?.user) {
    await adminClient.from('user_profiles').insert([{
      id: data.user.id,
      role,
      branch_id,
      nickname: nickname || email.split('@')[0]
    }]);
  }
  return data.user;
}
