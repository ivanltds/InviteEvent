-- Migration: Add Profile and Hero images to configurations
-- Objetivo: Suportar fotos dos noivos e carrossel de entrada.

ALTER TABLE configuracoes 
ADD COLUMN IF NOT EXISTS noiva_foto_url TEXT,
ADD COLUMN IF NOT EXISTS noivo_foto_url TEXT,
ADD COLUMN IF NOT EXISTS hero_images TEXT[] DEFAULT '{}';

-- Adicionar campo para controlar se o onboarding foi concluído
ALTER TABLE eventos
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

NOTIFY pgrst, 'reload schema';
