import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deduplicate() {
  const { data: categories, error } = await supabase.from('categories').select('id, name, created_at').order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching categories:', error);
    return;
  }
  
  console.log('Total Categories before deduplication:', categories.length);
  
  const seenNames = new Set();
  const duplicateIds = [];
  
  for (const cat of categories) {
    // Normalize name to catch slight differences like trailing spaces, but here exact match is fine
    const normalizedName = cat.name.trim();
    if (seenNames.has(normalizedName)) {
      duplicateIds.push(cat.id);
    } else {
      seenNames.add(normalizedName);
    }
  }
  
  console.log('Unique Categories:', Array.from(seenNames));
  console.log(`Found ${duplicateIds.length} duplicates to delete.`);
  
  if (duplicateIds.length > 0) {
    // Delete in batches if there are many
    const batchSize = 50;
    for (let i = 0; i < duplicateIds.length; i += batchSize) {
      const batch = duplicateIds.slice(i, i + batchSize);
      console.log(`Deleting batch of ${batch.length}...`);
      const { error: deleteError } = await supabase.from('categories').delete().in('id', batch);
      if (deleteError) {
        console.error('Error deleting batch:', deleteError);
      }
    }
    console.log('Deduplication complete.');
  } else {
    console.log('No duplicates found.');
  }
}

deduplicate().catch(console.error);
