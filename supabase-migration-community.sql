-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Change 1: Add community_joined column to users table

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS community_joined BOOLEAN DEFAULT false;
