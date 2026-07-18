-- =============================================================================
-- Inventory Integrity: Manual Verification Checklist
-- Run AFTER and AFTER after applying 05-inventory-integrity.sql
-- =============================================================================

-- A. Schema
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'inventory' AND column_name LIKE 'branch_%';
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'sale_items'
--     AND column_name IN ('unit_cost','unit_cost_used','total_cost','margin');
-- SELECT to_regclass('public.inventory_movements');
-- SELECT to_regclass('public.inventory_adjustments');

-- B. WAC purchase (example — replace UUIDs)
-- SELECT process_purchase(
--   '<branch_id>'::uuid,
--   '<manager_id>'::uuid,
--   '[{"product_id":"<product_id>","quantity":100,"unit_cost":100}]'::jsonb
-- );
-- SELECT stock_level, branch_buying_price FROM inventory
--   WHERE branch_id = '<branch_id>' AND product_id = '<product_id>';
-- Expect: stock 100, avg 100
--
-- SELECT process_purchase(
--   '<branch_id>'::uuid,
--   '<manager_id>'::uuid,
--   '[{"product_id":"<product_id>","quantity":50,"unit_cost":120}]'::jsonb
-- );
-- Expect: stock 150, avg ROUND((100*100+50*120)/150,2) = 106.67
-- purchase_items should show lines at 100 and 120 (not overwritten)

-- C. Sale COGS immutability
-- SELECT process_sale('<branch_id>','<seller_id>','REC-TEST',
--   '[{"product_id":"<product_id>","quantity":10,"unit_price":200}]'::jsonb);
-- SELECT unit_cost, unit_cost_used, total_cost, margin FROM sale_items
--   ORDER BY id DESC LIMIT 1;
-- Then purchase again at a different cost; prior sale_items must be unchanged.

-- D. Transfer round-trip
-- create_transfer → inventory down at source + TRANSFER_OUT movement
-- accept_transfer → inventory up at dest + TRANSFER_IN; status accepted
-- decline_transfer (on a second pending) → source restored; no dest add
-- Double accept_transfer must NOT double-add (idempotent)

-- E. Concurrency smoke
-- Open two sessions; process_sale insufficient stock on concurrent last unit
-- One succeeds, one raises 'Insufficient stock'

-- F. App UI smoke
-- Procurement restock → inventory + history
-- POS checkout → receipt + stock down
-- Seller accept incoming transfer → dest stock up
-- Reports margin unchanged after later purchase at different cost
-- Inventory valuation ≈ SUM(stock_level * branch_buying_price)
