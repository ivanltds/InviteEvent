# STORY-050: Galeria Pública de Fotos (Experiência do Convidado)

## Descrição
Como convidado, desejo visualizar as fotos do casal organizadas em álbuns na experiência do convite, para conhecer melhor a história visual dos noivos e me conectar emocionalmente com o evento.

## Contexto
O admin da galeria já está 100% funcional (`/admin/galeria` com upload Cloudinary assinado, CRUD de álbuns e fotos). Falta apenas a **página pública** para os convidados.

## Critérios de Aceitação
1. **Rota Pública:** Criar componente `Galeria.tsx` na experiência do convite `/inv/[slug]` OU página independente `/inv/[slug]/galeria`.
2. **Masonry Grid:** Exibir fotos em layout Pinterest/Masonry com lazy loading.
3. **Álbuns Públicos:** Filtrar apenas álbuns marcados como `publico = true` no banco.
4. **Lightbox:** Ao clicar numa foto, abrir em visualização ampliada com navegação.
5. **Download:** Permitir download da foto em alta resolução via double-click ou botão.
6. **Responsivo:** Layout mobile-first com colunas adaptativas.

## Valor de Negócio
Engajamento emocional do convidado e diferencial visual da plataforma.

## Prioridade: 🟡 Média
## Esforço: M (4-6h)
## Status: 📋 TODO

## Dependências
- ✅ `galleryService.ts` (já implementado)
- ✅ `/admin/galeria` (CRUD funcional)
- ✅ Signed uploads Cloudinary (STORY-044 DONE)

## Notas de UX
- Usar Cloudinary transformations para thumbnails (c_fill,w_400,h_400)
- Intersection Observer para lazy loading progressivo
- Animação de fade-in ao carregar cada imagem
