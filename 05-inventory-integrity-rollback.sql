-- =============================================================================
-- 05-inventory-integrity-rollback.sql
-- Reverses objects introduced by 05-inventory-integrity.sql where safe.
-- Does NOT drop branch_*_price columns or sale_items COGS columns (data-preserving).
-- =============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.process_purchase(UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS public.process_sale(UUID, UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.create_transfer(UUID, UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS public.accept_transfer(UUID, UUID);
DROP FUNCTION IF EXISTS public.decline_transfer(UUID, UUID);
DROP FUNCTION IF EXISTS public.apply_inventory_adjustment(UUID, UUID, UUID, INTEGER, TEXT, UUID);
DROP FUNCTION IF EXISTS public.reverse_sale_inventory(UUID);
DROP FUNCTION IF EXISTS public._insert_inventory_movement(UUID, UUID, TEXT, INTEGER, INTEGER, INTEGER, NUMERIC, TEXT, UUID, UUID);

-- Restore simpler decrement_inventory (no movement ledger)
CREATE OR REPLACE FUNCTION public.decrement_inventory(
  p_branch_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS void
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

DROP TABLE IF EXISTS public.inventory_movements;

-- Keep inventory_adjustments, branch prices, sale COGS columns, transfer_items.unit_cost
-- Dropping those would destroy production data.

COMMIT;
