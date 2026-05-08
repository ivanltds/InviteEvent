# Fluxo UX — Consolidação MVP (PRD-001)

Este documento detalha o mapeamento de telas e a lógica de interação projetada para o MVP.

## 1. Arquitetura de Informação
- **Área Pública (Guest):**
  - `/convite/[slug]` -> Landing Page & Informações.
  - `/convite/[slug]/rsvp` -> Formulário de confirmação.
  - `/convite/[slug]/presentes` -> Lista de presentes e checkout.
  - `/convite/[slug]/mural` -> Galeria de fotos e upload.
- **Área Privada (Admin):**
  - `/admin/dashboard` -> Resumo e métricas.
  - `/admin/convidados` -> Gestão de lista e importação.
  - `/admin/presentes` -> Cadastro de itens e extrato financeiro.
  - `/admin/mural` -> Moderação de conteúdo.

## 2. Wireframes Conceituais (Resumo)

### Tela: RSVP do Convidado
- **Cabeçalho:** Foto dos noivos e mensagem de boas-vindas.
- **Lista de Membros:** Cards individuais por nome.
- **Ação:** Toggle "Vou" / "Não vou".
- **Rodapé:** Botão fixo "Confirmar Presença".

### Tela: Lista de Presentes
- **Filtros:** "Cotas de Lua de Mel", "Casa", "Eletros".
- **Grid de Itens:** Imagem do item, Nome, Valor, Botão "Presentear".
- **Feedback:** Ícone de cadeado em itens já comprados.

### Tela: Mural de Fotos
- **Layout:** Grid Responsivo.
- **Interação:** Click na foto abre modal Lightbox com visualização da legenda e autor.
- **Engajamento:** Botão de reação (Coração) em cada card de foto.
- **CTA:** Área de "Drag & Drop" ou Botão centralizado para Upload.
- **Upload Flow:** Seleção de arquivo -> Campo de legenda opcional -> Barra de progresso -> Toast de sucesso/pendência.

## 3. Estados de Componente
- **Loading:** Skeleton screens para as listas de convidados e presentes.
- **Empty State:** Ilustrações amigáveis no Mural quando não houver fotos.
- **Error:** Alertas integrados aos inputs no formulário de RSVP.
- **Pendência:** Overlay ou badge "Em moderação" para fotos enviadas que aguardam aprovação do noivo.

## 4. Referências de Design
- Inspirado em Zola e iCasei, mas com foco em minimalismo e carregamento instantâneo.
- Uso de micro-interações via Framer Motion para transições de página.

---
*Assinado: Agente UX/UI Designer*
