-- Migration: Add phone number to convites table
ALTER TABLE convites ADD COLUMN IF NOT EXISTS telefone TEXT;
