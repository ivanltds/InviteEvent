# EPIC-009: Galeria de Memórias Interativa

## Status: 🟡 IN_PROGRESS (Admin DONE, Público PENDING)

## Descrição
Implementação de uma galeria de fotos dinâmica e interativa, inspirada no layout Pinterest, permitindo que os convidados visualizem e baixem fotos do casal e do evento.

## Stories
- [x] **Admin Galeria:** CRUD de álbuns e fotos com upload Cloudinary assinado. -> **✅ DONE** (`/admin/galeria`)
- [ ] **STORY-050:** Galeria Pública de Fotos (Experiência do Convidado). -> **📋 TODO**

## Notas de Arquitetura
- Armazenamento: Cloudinary com uploads assinados via `/api/media/sign`.
- Persistência: Tabelas `albums` e `fotos_galeria` com `evento_id`.
- Frontend Admin: Grid de fotos com upload múltiplo e progress tracking.
- Frontend Público: **PENDENTE** — Masonry Grid + Lightbox + Download.
