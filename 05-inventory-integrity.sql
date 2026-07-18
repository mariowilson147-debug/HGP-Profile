-- =============================================================================
-- 05-inventory-integrity.sql
-- Atomic inventory operations, movement ledger, WAC costing, schema drift fixes.
--
-- Costing model: Weighted Average Cost (WAC)
--   branch_buying_price stores the running average cost for on-hand stock.
--   purchase_items.unit_cost preserves each purchase's historical unit cost.
--   sale_items.unit_cost / unit_cost_used snapshot COGS at sale time (immutable).
--
-- Apply in Supabase SQL Editor (or via migration runner) AFTER deploying app changes.
-- Companion rollback: 05-inventory-integrity-rollback.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Schema drift: branch pricing columns on inventory
-- -----------------------------------------------------------------------------
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS branch_buying_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS branch_wholesale_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS branch_retail_price NUMERIC(12, 2);

COMMENT ON COLUMN public.inventory.branch_buying_price IS
  'Weighted average unit cost for on-hand stock at this branch (WAC).';

-- Seed WAC from catalogue cost where missing
UPDATE public.inventory i
SET branch_buying_price = p.buying_price
FROM public.products p
WHERE i.product_id = p.id
  AND i.branch_buying_price IS NULL
  AND p.buying_price IS NOT NULL;

UPDATE public.inventory i
SET branch_wholesale_price = p.wholesale_price
FROM public.products p
WHERE i.product_id = p.id
  AND i.branch_wholesale_price IS NULL
  AND p.wholesale_price IS NOT NULL;

UPDATE public.inventory i
SET branch_retail_price = p.retail_price
FROM public.products p
WHERE i.product_id = p.id
  AND i.branch_retail_price IS NULL
  AND p.retail_price IS NOT NULL;

-- Ensure unique (product_id, branch_id) for upserts / FOR UPDATE targeting
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inventory_product_id_branch_id_key'
      AND conrelid = 'public.inventory'::regclass
  ) THEN
    ALTER TABLE public.inventory
      ADD CONSTRAINT inventory_product_id_branch_id_key UNIQUE (product_id, branch_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN unique_violation THEN
    RAISE NOTICE 'inventory unique (product_id, branch_id) not added — resolve duplicates first';
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON public.inventory (branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory (product_id);

-- -----------------------------------------------------------------------------
-- 2. Sale items: immutable COGS fields
-- -----------------------------------------------------------------------------
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_cost_used NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS margin NUMERIC(12, 2);

-- Backfill from existing unit_cost / unit_price
UPDATE public.sale_items
SET
  unit_cost_used = COALESCE(unit_cost_used, unit_cost, 0),
  total_cost = COALESCE(total_cost, COALESCE(unit_cost, 0) * quantity),
  margin = COALESCE(margin, subtotal - (COALESCE(unit_cost, 0) * quantity))
WHERE unit_cost_used IS NULL
   OR total_cost IS NULL
   OR margin IS NULL;

COMMENT ON COLUMN public.sale_items.unit_cost_used IS
  'Unit COGS snapshotted at sale time (WAC). Never recompute from products.buying_price.';
COMMENT ON COLUMN public.sale_items.unit_cost IS
  'Legacy alias of unit_cost_used; kept for backward-compatible clients.';

-- Allow reversed sales status used by the app
COMMENT ON COLUMN public.sales.status IS
  'completed | refunded | reversed';

-- -----------------------------------------------------------------------------
-- 3. Transfer items: snapshot source unit cost at transfer-out
-- -----------------------------------------------------------------------------
ALTER TABLE public.transfer_items
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12, 2);

-- -----------------------------------------------------------------------------
-- 4. inventory_adjustments (used by app; was missing from checked-in SQL)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  old_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  difference INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_branch
  ON public.inventory_adjustments (branch_id, created_at DESC);

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inventory_adjustments' AND policyname = 'Allow read inventory_adjustments'
  ) THEN
    CREATE POLICY "Allow read inventory_adjustments"
      ON public.inventory_adjustments FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inventory_adjustments' AND policyname = 'Allow insert inventory_adjustments'
  ) THEN
    CREATE POLICY "Allow insert inventory_adjustments"
      ON public.inventory_adjustments FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Inventory movement ledger
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'PURCHASE',
    'SALE',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'ADJUSTMENT',
    'RETURN',
    'OPENING_BALANCE'
  )),
  quantity INTEGER NOT NULL, -- signed: +in / -out
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  unit_cost NUMERIC(12, 2), -- cost associated with this movement (purchase cost or WAC used)
  reference_type TEXT,      -- purchase | sale | transfer | adjustment
  reference_id UUID,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT inventory_movements_balance_check
    CHECK (balance_after = balance_before + quantity)
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_branch_product
  ON public.inventory_movements (branch_id, product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference
  ON public.inventory_movements (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at
  ON public.inventory_movements (created_at DESC);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inventory_movements' AND policyname = 'Allow read inventory_movements'
  ) THEN
    CREATE POLICY "Allow read inventory_movements"
      ON public.inventory_movements FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
  -- Writes only via SECURITY DEFINER RPCs (no direct INSERT policy for clients)
END $$;

-- -----------------------------------------------------------------------------
-- 6. Ensure purchases schema is header + items (canonical)
-- If a flat legacy purchases table exists without purchase_items FK, leave as-is;
-- process_purchase targets the header/items shape from 02-purchases-transfers.sql.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchases_branch_created
  ON public.purchases (branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase
  ON public.purchase_items (purchase_id);

-- -----------------------------------------------------------------------------
-- 7. Helper: insert movement row
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._insert_inventory_movement(
  p_branch_id UUID,
  p_product_id UUID,
  p_movement_type TEXT,
  p_quantity INTEGER,
  p_balance_before INTEGER,
  p_balance_after INTEGER,
  p_unit_cost NUMERIC,
  p_reference_type TEXT,
  p_reference_id UUID,
  p_created_by UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.inventory_movements (
    branch_id, product_id, movement_type, quantity,
    balance_before, balance_after, unit_cost,
    reference_type, reference_id, created_by
  ) VALUES (
    p_branch_id, p_product_id, p_movement_type, p_quantity,
    p_balance_before, p_balance_after, p_unit_cost,
    p_reference_type, p_reference_id, p_created_by
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 8. process_purchase — atomic restock + WAC + movements
-- p_items: [{ "product_id", "quantity", "unit_cost", "wholesale_price?", "retail_price?" }]
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_purchase(
  p_branch_id UUID,
  p_manager_id UUID,
  p_items JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id UUID;
  v_total NUMERIC(12, 2) := 0;
  v_item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
  v_unit_cost NUMERIC(12, 2);
  v_wholesale NUMERIC(12, 2);
  v_retail NUMERIC(12, 2);
  v_inv public.inventory%ROWTYPE;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
  v_old_avg NUMERIC(12, 2);
  v_new_avg NUMERIC(12, 2);
BEGIN
  IF p_branch_id IS NULL THEN
    RAISE EXCEPTION 'branch_id is required';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Purchase must contain at least one item';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INTEGER;
    v_unit_cost := (v_item->>'unit_cost')::NUMERIC;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Each purchase line must have quantity > 0';
    END IF;
    IF v_unit_cost IS NULL OR v_unit_cost < 0 THEN
      RAISE EXCEPTION 'Each purchase line must have a non-negative unit_cost';
    END IF;
    v_total := v_total + (v_qty * v_unit_cost);
  END LOOP;

  INSERT INTO public.purchases (branch_id, manager_id, total_amount, status)
  VALUES (p_branch_id, p_manager_id, v_total, 'completed')
  RETURNING id INTO v_purchase_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INTEGER;
    v_unit_cost := (v_item->>'unit_cost')::NUMERIC;
    v_wholesale := NULLIF(v_item->>'wholesale_price', '')::NUMERIC;
    v_retail := NULLIF(v_item->>'retail_price', '')::NUMERIC;

    INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_cost, subtotal)
    VALUES (v_purchase_id, v_product_id, v_qty, v_unit_cost, v_qty * v_unit_cost);

    SELECT * INTO v_inv
    FROM public.inventory
    WHERE product_id = v_product_id AND branch_id = p_branch_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_old_stock := 0;
      v_old_avg := 0;
      v_new_stock := v_qty;
      v_new_avg := v_unit_cost;

      INSERT INTO public.inventory (
        product_id, branch_id, stock_level, reorder_level,
        branch_buying_price, branch_wholesale_price, branch_retail_price, updated_at
      ) VALUES (
        v_product_id, p_branch_id, v_new_stock, 5,
        v_new_avg, COALESCE(v_wholesale, 0), COALESCE(v_retail, 0), now()
      );
    ELSE
      v_old_stock := COALESCE(v_inv.stock_level, 0);
      v_old_avg := COALESCE(v_inv.branch_buying_price, 0);
      v_new_stock := v_old_stock + v_qty;

      -- WAC: (old_qty * old_avg + qty * purchase_cost) / new_qty
      IF v_new_stock > 0 THEN
        v_new_avg := ROUND(((v_old_stock * v_old_avg) + (v_qty * v_unit_cost)) / v_new_stock, 2);
      ELSE
        v_new_avg := v_unit_cost;
      END IF;

      UPDATE public.inventory
      SET
        stock_level = v_new_stock,
        branch_buying_price = v_new_avg,
        branch_wholesale_price = COALESCE(v_wholesale, branch_wholesale_price),
        branch_retail_price = COALESCE(v_retail, branch_retail_price),
        updated_at = now()
      WHERE id = v_inv.id;
    END IF;

    PERFORM public._insert_inventory_movement(
      p_branch_id, v_product_id, 'PURCHASE', v_qty,
      v_old_stock, v_new_stock, v_unit_cost,
      'purchase', v_purchase_id, p_manager_id
    );
  END LOOP;

  RETURN v_purchase_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 9. process_sale — atomic sale + COGS snapshot + stock decrement + movements
-- p_items: [{ "product_id", "quantity", "unit_price" }]
-- COGS comes from locked inventory.branch_buying_price (WAC), not client input.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_sale(
  p_branch_id UUID,
  p_seller_id UUID,
  p_receipt_number TEXT,
  p_items JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id UUID;
  v_total NUMERIC(12, 2) := 0;
  v_item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
  v_unit_price NUMERIC(12, 2);
  v_unit_cost NUMERIC(12, 2);
  v_subtotal NUMERIC(12, 2);
  v_line_cost NUMERIC(12, 2);
  v_inv public.inventory%ROWTYPE;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  IF p_branch_id IS NULL OR p_seller_id IS NULL THEN
    RAISE EXCEPTION 'branch_id and seller_id are required';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Sale must contain at least one item';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INTEGER;
    v_unit_price := (v_item->>'unit_price')::NUMERIC;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Each sale line must have quantity > 0';
    END IF;
    v_total := v_total + (v_qty * COALESCE(v_unit_price, 0));
  END LOOP;

  INSERT INTO public.sales (branch_id, seller_id, total_amount, status, receipt_number)
  VALUES (p_branch_id, p_seller_id, v_total, 'completed', p_receipt_number)
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INTEGER;
    v_unit_price := (v_item->>'unit_price')::NUMERIC;
    v_subtotal := v_qty * v_unit_price;

    SELECT * INTO v_inv
    FROM public.inventory
    WHERE product_id = v_product_id AND branch_id = p_branch_id
    FOR UPDATE;

    IF NOT FOUND OR COALESCE(v_inv.stock_level, 0) < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product % (need %, have %)',
        v_product_id, v_qty, COALESCE(v_inv.stock_level, 0);
    END IF;

    v_old_stock := v_inv.stock_level;
    v_new_stock := v_old_stock - v_qty;
    v_unit_cost := COALESCE(v_inv.branch_buying_price, 0);
    v_line_cost := ROUND(v_unit_cost * v_qty, 2);

    UPDATE public.inventory
    SET stock_level = v_new_stock, updated_at = now()
    WHERE id = v_inv.id;

    INSERT INTO public.sale_items (
      sale_id, product_id, quantity, unit_price, subtotal,
      unit_cost, unit_cost_used, total_cost, margin
    ) VALUES (
      v_sale_id, v_product_id, v_qty, v_unit_price, v_subtotal,
      v_unit_cost, v_unit_cost, v_line_cost, ROUND(v_subtotal - v_line_cost, 2)
    );

    PERFORM public._insert_inventory_movement(
      p_branch_id, v_product_id, 'SALE', -v_qty,
      v_old_stock, v_new_stock, v_unit_cost,
      'sale', v_sale_id, p_seller_id
    );
  END LOOP;

  RETURN v_sale_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 10. Transfer RPCs (atomic + movements; accept is idempotent-safe)
-- p_items: [{ "product_id", "quantity" }]
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_transfer(
  p_from_branch_id UUID,
  p_to_branch_id UUID,
  p_created_by UUID,
  p_items JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
  v_inv public.inventory%ROWTYPE;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
  v_unit_cost NUMERIC(12, 2);
BEGIN
  IF p_from_branch_id IS NULL OR p_to_branch_id IS NULL THEN
    RAISE EXCEPTION 'from_branch_id and to_branch_id are required';
  END IF;
  IF p_from_branch_id = p_to_branch_id THEN
    RAISE EXCEPTION 'Source and destination branches must differ';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Transfer must contain at least one item';
  END IF;

  INSERT INTO public.transfers (from_branch_id, to_branch_id, status, created_by)
  VALUES (p_from_branch_id, p_to_branch_id, 'pending', p_created_by)
  RETURNING id INTO v_transfer_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INTEGER;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Each transfer line must have quantity > 0';
    END IF;

    SELECT * INTO v_inv
    FROM public.inventory
    WHERE product_id = v_product_id AND branch_id = p_from_branch_id
    FOR UPDATE;

    IF NOT FOUND OR COALESCE(v_inv.stock_level, 0) < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock at source for product %', v_product_id;
    END IF;

    v_old_stock := v_inv.stock_level;
    v_new_stock := v_old_stock - v_qty;
    v_unit_cost := COALESCE(v_inv.branch_buying_price, 0);

    UPDATE public.inventory
    SET stock_level = v_new_stock, updated_at = now()
    WHERE id = v_inv.id;

    INSERT INTO public.transfer_items (transfer_id, product_id, quantity, unit_cost)
    VALUES (v_transfer_id, v_product_id, v_qty, v_unit_cost);

    PERFORM public._insert_inventory_movement(
      p_from_branch_id, v_product_id, 'TRANSFER_OUT', -v_qty,
      v_old_stock, v_new_stock, v_unit_cost,
      'transfer', v_transfer_id, p_created_by
    );
  END LOOP;

  RETURN v_transfer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_transfer(
  p_transfer_id UUID,
  p_actor_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer public.transfers%ROWTYPE;
  v_item RECORD;
  v_inv public.inventory%ROWTYPE;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
  v_old_avg NUMERIC(12, 2);
  v_xfer_cost NUMERIC(12, 2);
  v_new_avg NUMERIC(12, 2);
BEGIN
  SELECT * INTO v_transfer
  FROM public.transfers
  WHERE id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;

  -- Idempotent: already accepted → no double stock add
  IF v_transfer.status = 'accepted' THEN
    RETURN p_transfer_id;
  END IF;

  IF v_transfer.status <> 'pending' THEN
    RAISE EXCEPTION 'Transfer cannot be accepted from status %', v_transfer.status;
  END IF;

  FOR v_item IN
    SELECT * FROM public.transfer_items WHERE transfer_id = p_transfer_id
  LOOP
    v_xfer_cost := COALESCE(v_item.unit_cost, 0);

    SELECT * INTO v_inv
    FROM public.inventory
    WHERE product_id = v_item.product_id AND branch_id = v_transfer.to_branch_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_old_stock := 0;
      v_new_stock := v_item.quantity;
      v_new_avg := v_xfer_cost;

      INSERT INTO public.inventory (
        product_id, branch_id, stock_level, reorder_level,
        branch_buying_price, updated_at
      ) VALUES (
        v_item.product_id, v_transfer.to_branch_id, v_new_stock, 5,
        v_new_avg, now()
      );
    ELSE
      v_old_stock := COALESCE(v_inv.stock_level, 0);
      v_old_avg := COALESCE(v_inv.branch_buying_price, 0);
      v_new_stock := v_old_stock + v_item.quantity;

      IF v_new_stock > 0 THEN
        v_new_avg := ROUND(((v_old_stock * v_old_avg) + (v_item.quantity * v_xfer_cost)) / v_new_stock, 2);
      ELSE
        v_new_avg := v_xfer_cost;
      END IF;

      UPDATE public.inventory
      SET
        stock_level = v_new_stock,
        branch_buying_price = v_new_avg,
        updated_at = now()
      WHERE id = v_inv.id;
    END IF;

    PERFORM public._insert_inventory_movement(
      v_transfer.to_branch_id, v_item.product_id, 'TRANSFER_IN', v_item.quantity,
      v_old_stock, v_new_stock, v_xfer_cost,
      'transfer', p_transfer_id, COALESCE(p_actor_id, v_transfer.created_by)
    );
  END LOOP;

  UPDATE public.transfers
  SET status = 'accepted', updated_at = now()
  WHERE id = p_transfer_id;

  RETURN p_transfer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_transfer(
  p_transfer_id UUID,
  p_actor_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer public.transfers%ROWTYPE;
  v_item RECORD;
  v_inv public.inventory%ROWTYPE;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  SELECT * INTO v_transfer
  FROM public.transfers
  WHERE id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;

  IF v_transfer.status = 'declined' THEN
    RETURN p_transfer_id;
  END IF;

  IF v_transfer.status <> 'pending' THEN
    RAISE EXCEPTION 'Transfer cannot be declined from status %', v_transfer.status;
  END IF;

  -- Return stock to source (was deducted on create)
  FOR v_item IN
    SELECT * FROM public.transfer_items WHERE transfer_id = p_transfer_id
  LOOP
    SELECT * INTO v_inv
    FROM public.inventory
    WHERE product_id = v_item.product_id AND branch_id = v_transfer.from_branch_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Source inventory missing for product % on decline', v_item.product_id;
    END IF;

    v_old_stock := v_inv.stock_level;
    v_new_stock := v_old_stock + v_item.quantity;

    UPDATE public.inventory
    SET stock_level = v_new_stock, updated_at = now()
    WHERE id = v_inv.id;

    PERFORM public._insert_inventory_movement(
      v_transfer.from_branch_id, v_item.product_id, 'RETURN', v_item.quantity,
      v_old_stock, v_new_stock, COALESCE(v_item.unit_cost, v_inv.branch_buying_price),
      'transfer', p_transfer_id, COALESCE(p_actor_id, v_transfer.created_by)
    );
  END LOOP;

  UPDATE public.transfers
  SET status = 'declined', updated_at = now()
  WHERE id = p_transfer_id;

  RETURN p_transfer_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 11. Adjustments + reverse sale
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_inventory_adjustment(
  p_branch_id UUID,
  p_product_id UUID,
  p_manager_id UUID,
  p_new_stock INTEGER,
  p_reason TEXT,
  p_inventory_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.inventory%ROWTYPE;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
  v_diff INTEGER;
  v_adj_id UUID;
  v_movement_type TEXT;
BEGIN
  IF p_new_stock IS NULL OR p_new_stock < 0 THEN
    RAISE EXCEPTION 'new_stock must be >= 0';
  END IF;

  IF p_inventory_id IS NOT NULL THEN
    SELECT * INTO v_inv FROM public.inventory WHERE id = p_inventory_id FOR UPDATE;
  ELSE
    SELECT * INTO v_inv
    FROM public.inventory
    WHERE branch_id = p_branch_id AND product_id = p_product_id
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    v_old_stock := 0;
    v_new_stock := p_new_stock;
    INSERT INTO public.inventory (branch_id, product_id, stock_level, reorder_level, updated_at)
    VALUES (p_branch_id, p_product_id, v_new_stock, 5, now())
    RETURNING * INTO v_inv;
  ELSE
    v_old_stock := COALESCE(v_inv.stock_level, 0);
    v_new_stock := p_new_stock;
    UPDATE public.inventory
    SET stock_level = v_new_stock, updated_at = now()
    WHERE id = v_inv.id;
  END IF;

  v_diff := v_new_stock - v_old_stock;

  INSERT INTO public.inventory_adjustments (
    branch_id, product_id, manager_id, old_stock, new_stock, difference, reason
  ) VALUES (
    p_branch_id, p_product_id, p_manager_id, v_old_stock, v_new_stock, v_diff, COALESCE(p_reason, '')
  )
  RETURNING id INTO v_adj_id;

  v_movement_type := CASE WHEN v_diff < 0 THEN 'ADJUSTMENT' ELSE 'ADJUSTMENT' END;

  PERFORM public._insert_inventory_movement(
    p_branch_id, p_product_id, v_movement_type, v_diff,
    v_old_stock, v_new_stock, COALESCE(v_inv.branch_buying_price, 0),
    'adjustment', v_adj_id, p_manager_id
  );

  RETURN v_adj_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_sale_inventory(
  p_sale_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale public.sales%ROWTYPE;
  v_item RECORD;
  v_inv public.inventory%ROWTYPE;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
  v_unit_cost NUMERIC(12, 2);
BEGIN
  SELECT * INTO v_sale
  FROM public.sales
  WHERE id = p_sale_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;

  IF v_sale.status = 'reversed' THEN
    RETURN p_sale_id; -- idempotent
  END IF;

  FOR v_item IN
    SELECT * FROM public.sale_items WHERE sale_id = p_sale_id
  LOOP
    v_unit_cost := COALESCE(v_item.unit_cost_used, v_item.unit_cost, 0);

    SELECT * INTO v_inv
    FROM public.inventory
    WHERE branch_id = v_sale.branch_id AND product_id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_old_stock := 0;
      v_new_stock := v_item.quantity;
      INSERT INTO public.inventory (
        branch_id, product_id, stock_level, reorder_level, branch_buying_price, updated_at
      ) VALUES (
        v_sale.branch_id, v_item.product_id, v_new_stock, 5, v_unit_cost, now()
      );
    ELSE
      v_old_stock := v_inv.stock_level;
      v_new_stock := v_old_stock + v_item.quantity;

      -- Returning stock: re-blend WAC with original sale cost
      UPDATE public.inventory
      SET
        stock_level = v_new_stock,
        branch_buying_price = CASE
          WHEN v_new_stock > 0 THEN
            ROUND((
              (v_old_stock * COALESCE(v_inv.branch_buying_price, 0))
              + (v_item.quantity * v_unit_cost)
            ) / v_new_stock, 2)
          ELSE COALESCE(v_inv.branch_buying_price, v_unit_cost)
        END,
        updated_at = now()
      WHERE id = v_inv.id;
    END IF;

    PERFORM public._insert_inventory_movement(
      v_sale.branch_id, v_item.product_id, 'RETURN', v_item.quantity,
      v_old_stock, v_new_stock, v_unit_cost,
      'sale', p_sale_id, v_sale.seller_id
    );
  END LOOP;

  UPDATE public.sales
  SET status = 'reversed'
  WHERE id = p_sale_id;

  RETURN p_sale_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 12. Keep decrement_inventory but record movements (compat for old clients)
-- Prefer process_sale for new checkouts.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_inventory(
  p_branch_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.inventory%ROWTYPE;
  v_old INTEGER;
  v_new INTEGER;
BEGIN
  SELECT * INTO v_inv
  FROM public.inventory
  WHERE branch_id = p_branch_id AND product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND OR COALESCE(v_inv.stock_level, 0) < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock or inventory record not found';
  END IF;

  v_old := v_inv.stock_level;
  v_new := v_old - p_quantity;

  UPDATE public.inventory
  SET stock_level = v_new, updated_at = now()
  WHERE id = v_inv.id;

  PERFORM public._insert_inventory_movement(
    p_branch_id, p_product_id, 'SALE', -p_quantity,
    v_old, v_new, COALESCE(v_inv.branch_buying_price, 0),
    NULL, NULL, NULL
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 13. Grants for authenticated clients calling RPCs
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.process_purchase(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_sale(UUID, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_transfer(UUID, UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_transfer(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_transfer(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_inventory_adjustment(UUID, UUID, UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_sale_inventory(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_inventory(UUID, UUID, INTEGER) TO authenticated;
-- Internal helper: not granted to clients; callable only by other SECURITY DEFINER functions

GRANT SELECT ON public.inventory_movements TO authenticated;
GRANT SELECT, INSERT ON public.inventory_adjustments TO authenticated;

COMMIT;
