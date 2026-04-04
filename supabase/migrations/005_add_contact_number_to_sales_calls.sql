-- Add contact_number field to sales_calls table
-- This allows users to quickly note down a phone number during a call

ALTER TABLE public.sales_calls 
ADD COLUMN IF NOT EXISTS contact_number TEXT;

-- Add index for phone number searches
CREATE INDEX IF NOT EXISTS idx_sales_calls_contact_number ON public.sales_calls(contact_number);
