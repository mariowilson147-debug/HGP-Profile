import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAllPlumping() {
  console.log("Fetching products to find 'plump'...");
  
  // fetch all products to check
  const { data: products, error } = await supabase
    .from('products')
    .select('id, category');
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  let count = 0;
  for (const p of products) {
    if (p.category && p.category.toLowerCase().includes('plump')) {
      console.log(`Found product ${p.id} with category "${p.category}". Updating...`);
      const newCategory = 'Bathroom & Plumbing';
      await supabase.from('products').update({ category: newCategory }).eq('id', p.id);
      count++;
    }
  }
  
  console.log(`Updated ${count} products.`);
}

fixAllPlumping();
