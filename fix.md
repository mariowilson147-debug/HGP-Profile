# Inventory Integrity Fix

## Summary

Redesigned the inventory subsystem for atomic stock updates, a movement ledger, correct transfer acceptance, weighted-average costing (WAC), and immutable sale COGS in reports.

**Stack:** React + Supabase + PostgreSQL  
**Date:** 2026-07-18

---

## Problems Addressed

1. **Non-atomic purchases** — Client computed `newStock` from React state and issued separate inserts/upserts. Race conditions and partial failures were possible.
2. **No movement ledger** — Only `inventory.stock_level` changed; no audit trail for purchases, sales, transfers, or adjustments.
3. **Broken transfer accept (seller)** — Source stock was deducted on create; seller accept only updated status and never increased destination stock.
4. **Incorrect costing** — Each purchase overwrote `branch_buying_price` / global `products.buying_price`, so new prices revalued all remaining stock (e.g. 100@100 + 50@120 → 150@120).
5. **Unstable report margins** — Reports recomputed COGS from live `products.buying_price`, so historical profit changed after later purchases.

---

## Costing Decision: Weighted Average Cost (WAC)

FIFO would require inventory batches and consume-on-sale/transfer everywhere (high blast radius).

**WAC fits the existing model** (one cost per product × branch):

| Rule | Behavior |
|------|----------|
| On purchase | `new_avg = (old_qty × old_avg + qty × unit_cost) / (old_qty + qty)` stored in `inventory.branch_buying_price` |
| On sale | Snapshot current WAC onto `sale_items` — never rewrite later |
| Historical purchases | Preserved in `purchase_items.unit_cost` |
| Catalogue | `products.buying_price` is catalogue only; purchases no longer overwrite it |

**Example:** 100 @ 100 + 50 @ 120 → **150 @ 106.67** average. Purchase lines remain 100 and 120.

---

## Database Deliverables

Apply in order in the Supabase SQL Editor **before** relying on the updated app:

| File | Purpose |
|------|---------|
| `05-inventory-integrity.sql` | Schema fixes, ledger, RPCs, grants |
| `05-inventory-integrity-rollback.sql` | Drops new RPCs/ledger; keeps price/COGS columns (data-preserving) |
| `05-inventory-integrity-tests.sql` | Manual verification checklist |

### Schema changes

- `inventory.branch_buying_price` / `branch_wholesale_price` / `branch_retail_price` (schema-drift fix)
- `sale_items.unit_cost_used`, `total_cost`, `margin` (immutable COGS; `unit_cost` kept as alias)
- `transfer_items.unit_cost` (source WAC snapshotted at transfer-out)
- `inventory_adjustments` table (formalized; was used by app but missing from SQL)
- `inventory_movements` ledger:

  - Types: `PURCHASE`, `SALE`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT`, `RETURN`, `OPENING_BALANCE`
  - Fields: quantities, balances before/after, unit_cost, reference_type/id, created_by, created_at

### RPCs (all `SECURITY DEFINER`, row-locked with `FOR UPDATE`)

| RPC | Role |
|-----|------|
| `process_purchase(branch, manager, items jsonb)` | Atomic purchase + WAC + movements |
| `process_sale(branch, seller, receipt, items jsonb)` | Atomic sale + COGS snapshot + stock decrement |
| `create_transfer(from, to, actor, items jsonb)` | Deduct source, snapshot unit_cost, `TRANSFER_OUT` |
| `accept_transfer(id, actor)` | Add dest with WAC blend; idempotent if already accepted |
| `decline_transfer(id, actor)` | Restore source; idempotent if already declined |
| `apply_inventory_adjustment(...)` | Set stock + adjustment log + movement |
| `reverse_sale_inventory(sale_id)` | Restore stock using sale COGS; mark sale `reversed` |
| `decrement_inventory(...)` | Kept for compat; now also writes a movement |

Stock updates use SQL arithmetic (`stock_level = stock_level ± qty`), never client-computed absolute levels.

---

## Frontend Updates

| Surface | Change |
|---------|--------|
| `ProcurementView` | Calls `process_purchase` only |
| `POSView` | Calls `process_sale` only |
| `TransfersView` | Create / accept / decline via RPCs |
| `seller/actions` | Accept/decline via RPCs (fixed missing dest stock) |
| `manager/actions` + `ActionsView` | Purchases via RPC; no longer overwrite `products.buying_price` |
| `actions.ts` | `createAdjustment` / `reverseSale` call RPCs |
| `ReportsView` | Margins from `unit_cost_used` / `total_cost` / `margin`; excludes reversed sales |
| `SessionsView` | Prefer sale-time COGS fields |
| `InventoryView` | Valuation = `stock × branch_buying_price` (WAC); shows avg cost column |

---

## Behavioral Guarantees

1. Purchases increase inventory for the **selected branch only**, inside one DB transaction.
2. Concurrent purchase / sale / transfer cannot clobber stock via stale React state.
3. Accepting a transfer **once** increases destination stock; double-accept does not double-add.
4. Declining restores source stock.
5. Future purchases do not rewrite historical `purchase_items` or `sale_items` COGS.
6. Reports / sessions use snapshotted sale cost, so historical margins stay stable.
7. Inventory valuation uses branch WAC, not catalogue `products.buying_price`.

---

## Deploy Steps

1. Backup DB (or use a staging project).
2. Run `05-inventory-integrity.sql` in Supabase SQL Editor.
3. Confirm functions exist:  
   `SELECT proname FROM pg_proc WHERE proname LIKE 'process_%' OR proname LIKE '%transfer%';`
4. Deploy frontend changes.
5. Smoke-test using `05-inventory-integrity-tests.sql` and UI flows below.

---

## Testing Strategy

### SQL / WAC

1. Purchase 100 @ 100 → expect stock 100, avg 100.
2. Purchase 50 @ 120 → expect stock 150, avg **106.67**.
3. Confirm two `purchase_items` rows (100 and 120).
4. Confirm `inventory_movements` has two `PURCHASE` rows.

### Sales & reports

1. Sell 10 units (unit price known).
2. Note `sale_items.unit_cost_used` / `total_cost` / `margin`.
3. Purchase again at a different cost.
4. Confirm prior sale_items and report margin for that sale are unchanged.

### Transfers

1. Create transfer → source down, `TRANSFER_OUT` movement, status `pending`.
2. Accept as manager **and** as seller → dest up, `TRANSFER_IN`, status `accepted`.
3. Call `accept_transfer` again → no double stock.
4. Create another transfer and decline → source restored, no dest add.

### Adjustments & reverse

1. Adjust stock → `inventory_adjustments` + `ADJUSTMENT` movement.
2. Reverse a sale → stock restored, status `reversed`, excluded from report totals.

### Concurrency

1. Two sessions attempt to sell the last unit → one succeeds, one fails with insufficient stock.

### UI smoke

- [ ] Manager/Admin procurement restock
- [ ] POS checkout
- [ ] Seller incoming transfer accept
- [ ] Reports margin after a later purchase at a new price
- [ ] Inventory valuation matches `SUM(stock_level * branch_buying_price)`

---

## Out of Scope / Notes

- Branch-scoped RLS is still broad (`authenticated` CRUD); integrity now lives in RPCs + row locks.
- Legacy flat `purchases` schema (`supabase_updates.sql`) is obsolete; all purchase paths use header + `purchase_items` via `process_purchase`.
- Catalogue margin on admin products pages still uses `products.buying_price` (display catalogue margin, not inventory COGS).
- FIFO layers were not implemented; WAC is intentional for this architecture.
