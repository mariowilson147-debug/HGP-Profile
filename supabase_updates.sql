-- Run this in your Supabase SQL Editor

-- 1. Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Policies for purchases
CREATE POLICY "Managers can view purchases for their branches"
    ON public.purchases FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('manager', 'ceo', 'admin'))
    );

CREATE POLICY "Managers can insert purchases"
    ON public.purchases FOR INSERT
    WITH CHECK (
        auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('manager', 'ceo', 'admin'))
    );

-- 2. Add assigned_branches to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='assigned_branches') THEN
        ALTER TABLE public.user_profiles ADD COLUMN assigned_branches UUID[];
    END IF;
END $$;
