import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1');
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  try {
    console.log("Fetching existing branches and products...");
    const { data: branches } = await supabase.from('branches').select('id, name');
    const { data: products } = await supabase.from('products').select('id, buying_price, retail_price');
    
    if (!branches || !products || branches.length === 0 || products.length === 0) {
      console.error("Missing branches or products. Please ensure the database has branches and products.");
      return;
    }
    
    const branchIds = branches.map(b => b.id);
    console.log(`Found ${branches.length} branches and ${products.length} products.`);

    console.log("Creating/Updating Demo Users...");
    const demoUsers = [
      { email: 'manager@branch.com', role: 'manager' },
      { email: 'seller@branch.com', role: 'seller' }
    ];

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    
    for (const du of demoUsers) {
      let userId;
      const existing = existingUsers?.users?.find(u => u.email === du.email);
      
      if (existing) {
        userId = existing.id;
        await supabase.auth.admin.updateUserById(userId, { password: 'madee' });
        console.log(`Updated existing user ${du.email}`);
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: du.email,
          password: 'madee',
          email_confirm: true
        });
        if (createError) throw createError;
        userId = newUser.user.id;
        console.log(`Created new user ${du.email}`);
      }
      
      await supabase.from('user_profiles').upsert({
        id: userId,
        email: du.email,
        role: du.role,
        nickname: du.email.split('@')[0],
        assigned_branches: branchIds
      });
    }

    const { data: updatedUsers } = await supabase.auth.admin.listUsers();
    const sellerUser = updatedUsers?.users?.find(u => u.email === 'seller@branch.com');
    const sellerId = sellerUser?.id;

    console.log("Seeding Inventory & Sales...");
    const allInventory = [];
    for (const branch of branches) {
      for (const product of products) {
        allInventory.push({
          branch_id: branch.id,
          product_id: product.id,
          stock_level: Math.floor(Math.random() * 50) + 10,
          branch_buying_price: product.buying_price,
          branch_retail_price: product.retail_price
        });
      }
    }
    
    // Chunk inventory upserts (1000 items per chunk)
    for (let i = 0; i < allInventory.length; i += 1000) {
      const chunk = allInventory.slice(i, i + 1000);
      await supabase.from('inventory').upsert(chunk, { onConflict: 'branch_id, product_id' });
    }
    console.log("Inventory seeded.");

    for (const branch of branches) {
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 14)); 
        date.setHours(Math.floor(Math.random() * 12) + 8); 
        
        const numItems = Math.floor(Math.random() * 3) + 1;
        const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
        const cartProducts = shuffledProducts.slice(0, numItems);
        
        let total = 0;
        const itemsToInsert = [];
        for (const p of cartProducts) {
          const qty = Math.floor(Math.random() * 3) + 1;
          const subtotal = (p.retail_price || 0) * qty;
          total += subtotal;
          itemsToInsert.push({
            product_id: p.id,
            quantity: qty,
            unit_price: p.retail_price,
            subtotal: subtotal
          });
        }
        
        const receiptNumber = 'REC-DEMO-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        
        const { data: sale } = await supabase.from('sales').insert({
          branch_id: branch.id,
          seller_id: sellerId,
          total_amount: total,
          status: 'completed',
          receipt_number: receiptNumber,
          created_at: date.toISOString()
        }).select().single();
        
        if (sale) {
          await supabase.from('sale_items').insert(
            itemsToInsert.map(item => ({ sale_id: sale.id, ...item }))
          );
        }
      }
    }

    console.log("Demo data seeded successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
  }
}

run();
