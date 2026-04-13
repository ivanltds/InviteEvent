# STORY-044: Uploads Assinados e Proteção de Mídia (Cloudinary)

## Descrição
Como administrador da plataforma, desejo que todos os uploads de imagens sejam realizados via assinaturas server-side (Signed Uploads), para garantir que apenas usuários autenticados possam subir arquivos e evitar o uso indevido da nossa conta Cloudinary.

## Critérios de Aceitação
1. **Signature API:** Criar rota `/api/media/sign` que gera um token de assinatura do Cloudinary apenas para usuários com sessão ativa no Supabase.
2. **Restrição de Tamanho:** Validar no server-side que o arquivo não excede 5MB.
3. **Vínculo de Pasta:** Organizar os uploads no Cloudinary em pastas por ID do Evento (`events/{eventId}/...`).
4. **Middleware Media:** Bloquear tentativas de upload direto via cliente que não contenham a assinatura válida.

## Valor de Negócio
Segurança de infraestrutura e previsibilidade de custos com storage.

## Status: ✅ DONE 🏆

## Notas de Implementação
- Rota `/api/media/sign` implementada com validação de sessão
- `galleryService.getSignature()` gera tokens assinados por evento
- Upload no Galeria Admin usa `formData` com `signature`, `api_key`, `timestamp`
- Pasta organizada por `folder: signData.folder` (eventos/{eventId})
