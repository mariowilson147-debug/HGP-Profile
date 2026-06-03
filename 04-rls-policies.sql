-- Run this in your Supabase SQL Editor to fix the RLS policies for operations

-- Inventory Policies
CREATE POLICY "Allow insert access to inventory" ON public.inventory FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access to inventory" ON public.inventory FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access to inventory" ON public.inventory FOR DELETE USING (auth.role() = 'authenticated');

-- Sales Policies
CREATE POLICY "Allow read access to sales" ON public.sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access to sales" ON public.sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access to sales" ON public.sales FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access to sales" ON public.sales FOR DELETE USING (auth.role() = 'authenticated');

-- Sale Items Policies
CREATE POLICY "Allow read access to sale items" ON public.sale_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access to sale items" ON public.sale_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access to sale items" ON public.sale_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access to sale items" ON public.sale_items FOR DELETE USING (auth.role() = 'authenticated');

-- Transfers Policies
CREATE POLICY "Allow read access to transfers" ON public.transfers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access to transfers" ON public.transfers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access to transfers" ON public.transfers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access to transfers" ON public.transfers FOR DELETE USING (auth.role() = 'authenticated');

-- Transfer Items Policies
CREATE POLICY "Allow read access to transfer items" ON public.transfer_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access to transfer items" ON public.transfer_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access to transfer items" ON public.transfer_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access to transfer items" ON public.transfer_items FOR DELETE USING (auth.role() = 'authenticated');

-- Stock Takes Policies
CREATE POLICY "Allow read access to stock takes" ON public.stock_takes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access to stock takes" ON public.stock_takes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access to stock takes" ON public.stock_takes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access to stock takes" ON public.stock_takes FOR DELETE USING (auth.role() = 'authenticated');

-- Stock Take Items Policies
CREATE POLICY "Allow read access to stock take items" ON public.stock_take_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert access to stock take items" ON public.stock_take_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access to stock take items" ON public.stock_take_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access to stock take items" ON public.stock_take_items FOR DELETE USING (auth.role() = 'authenticated');
