# EPIC-009: Galeria de Memórias Interativa

## Status: ⚪ Draft

## Descrição
Implementação de uma galeria de fotos dinâmica e interativa, inspirada no layout Pinterest, permitindo que os convidados visualizem e baixem fotos do casal e do evento.

## Stories
- [ ] **STORY-029:** Galeria de Fotos Interativa (Visual & Memórias).

## Notas de Arquitetura
- Armazenamento: Cloudinary (pasta `invite/galeria`).
- Persistência: Novos campos na tabela `configuracoes`.
- Frontend: Implementação de Masonry Grid ou CSS Grid elegante.
- Interação: Event listener de `dblclick` para trigger de download de imagem via URL do Cloudinary.
