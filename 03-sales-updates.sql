-- Run this in your Supabase SQL Editor to update the sales schema

-- 1. Add receipt_number to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- Generate a receipt number for existing records (optional, using a default sequence or random)
UPDATE public.sales SET receipt_number = 'REC-' || substr(id::text, 1, 8) WHERE receipt_number IS NULL;

-- 2. Add unit_cost to sale_items table
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10, 2) DEFAULT 0;

-- 3. Create or update an RPC function to decrement inventory securely
-- Drop the existing function first to update its signature if needed
DROP FUNCTION IF EXISTS decrement_inventory(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION decrement_inventory(p_branch_id uuid, p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inventory
  SET stock_level = stock_level - p_quantity
  WHERE branch_id = p_branch_id AND product_id = p_product_id AND stock_level >= p_quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock or inventory record not found';
  END IF;
END;
$$;
