-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- AiSensy WhatsApp delivery queue table

CREATE TABLE IF NOT EXISTS public.pending_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  product_name TEXT,
  brand TEXT,
  category TEXT,
  result TEXT,
  keywords JSONB,
  image_urls JSONB,
  demo_image_urls JSONB,
  is_paid BOOLEAN DEFAULT false,
  user_email TEXT,
  whatsapp_number TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pending_deliveries DISABLE ROW LEVEL SECURITY;

-- If table already exists, add the whatsapp_number column:
ALTER TABLE public.pending_deliveries ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
