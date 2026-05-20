import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: products } = await supabase.from('products').select('category');
  const activeNames = new Set(products.map(p => p.category).filter(Boolean));
  
  const { data: categories } = await supabase.from('categories').select('id, name');
  
  console.log('Total Products:', products.length);
  console.log('Active Category Names:', Array.from(activeNames));
  console.log('Total Categories in DB:', categories.length);
  
  const empty = categories.filter(c => !activeNames.has(c.name));
  console.log('Empty Categories to delete:', empty);
  
  if (empty.length > 0) {
    const ids = empty.map(c => c.id);
    console.log('Deleting IDs:', ids);
    const { error } = await supabase.from('categories').delete().in('id', ids);
    if (error) {
      console.error('Delete Error:', error);
    } else {
      console.log('Deleted successfully via script.');
    }
  }
}

check().catch(console.error);
