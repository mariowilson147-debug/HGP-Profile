import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function printCategories() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, category');
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  const cats = new Set(products.map(p => p.category));
  console.log("Unique product categories:", Array.from(cats));
}

printCategories();
