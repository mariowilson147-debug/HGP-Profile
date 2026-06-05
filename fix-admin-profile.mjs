import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminProfile() {
  console.log("Checking admin profile for:", adminUid);
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', adminUid)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching profile:", error);
  }
  
  if (profile) {
    console.log("Admin profile already exists:", profile);
  } else {
    console.log("Admin profile missing. Inserting...");
    const { data: inserted, error: insertError } = await supabase
      .from('user_profiles')
      .insert([{ id: adminUid, role: 'admin' }])
      .select()
      .single();
      
    if (insertError) {
      console.error("Failed to insert admin profile:", insertError);
    } else {
      console.log("Successfully inserted admin profile:", inserted);
    }
  }
}

checkAdminProfile();
