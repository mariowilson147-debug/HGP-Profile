-- Run this script in your Supabase SQL Editor to update the Purchases schema

-- 1. Recreate Purchases table (Header)
DROP TABLE IF EXISTS public.purchase_items CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;

CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Purchase Items table (Detail)
CREATE TABLE public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view and insert (RLS logic handled in app logic for now)
CREATE POLICY "Allow read access to purchases" ON public.purchases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access to purchases" ON public.purchases FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow read access to purchase items" ON public.purchase_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access to purchase items" ON public.purchase_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
