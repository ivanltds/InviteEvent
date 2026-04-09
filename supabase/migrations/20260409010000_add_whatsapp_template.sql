-- Migration: Add WhatsApp Template config
-- Objetivo: Permitir que o usuário personalize a mensagem de convite

ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS whatsapp_template TEXT DEFAULT 'Olá, {nome}! É com muita alegria que convidamos você para o nosso casamento. Veja todos os detalhes e confirme sua presença no link: {link}';
