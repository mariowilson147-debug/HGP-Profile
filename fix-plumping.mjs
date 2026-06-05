import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPlumping() {
  console.log("Fixing 'plumping' in DB...");
  const { data, error } = await supabase
    .from('products')
    .update({ category: 'Bathroom & Plumbing' })
    .eq('category', 'Bathroom & Plumping');
    
  if (error) {
    console.error("Error updating category:", error);
  } else {
    console.log("Successfully updated category.");
  }
}

fixPlumping();
