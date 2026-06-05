import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCategoriesTable() {
  console.log("Checking categories table...");
  const { data: categories, error } = await supabase.from('categories').select('*');
  if (error) {
    console.error("Error fetching categories:", error);
    return;
  }
  
  let updated = 0;
  for (const c of categories) {
    if (c.name && c.name.toLowerCase().includes('plump')) {
      console.log(`Found category ${c.name}, fixing to Bathroom & Plumbing...`);
      await supabase.from('categories').update({ name: 'Bathroom & Plumbing' }).eq('id', c.id);
      updated++;
    }
  }
  console.log(`Fixed ${updated} categories in 'categories' table.`);
}

fixCategoriesTable();
