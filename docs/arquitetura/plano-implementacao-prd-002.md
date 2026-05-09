# Plano de Implementação Técnica — PRD-002 (Nova UI Premium)
> Autor: @architect | Status: ELABORAÇÃO | Fase: ARQUITETURA

Este plano traduz os requisitos estéticos e funcionais da experiência **Majestosa** (PRD-002) em especificações de arquitetura de software, englobando componentes React, modelo de estados, animações com Framer Motion e esquema do banco de dados no Supabase.

---

## 1. Arquitetura Front-End & Animações (Framer Motion)

Utilizaremos **Next.js (App Router)** e **Framer Motion** para gerenciar as animações sequenciais de alta performance. As animações serão aceleradas por GPU, minimizando o *Layout Shift* e engasgos de processamento em dispositivos mobile.

### 1.1. Máquina de Estados do Envelope Digital (`<EnvelopeDigital />`)
Gerenciaremos a sequência de abertura através de um estado numérico simples (`step`) para orquestrar as classes de animação e renderização.

```typescript
type EnvelopeStep = 
  | 'SEALED'       // 1. Selado, aguardando clique
  | 'OPENING_FLAP' // 2. Aba se abrindo em 3D
  | 'SLIDING_OUT'  // 3. Convite interno deslizando para fora
  | 'MORPH_FULL'   // 4. Cartão assume o centro e inicia textos
  | 'FULL_SCREEN'  // 5. Expansão completa para 100vw/100vh com efeito blur
```

**Estratégia de Otimização e Preloading (Sem Travamentos):**
Para evitar que o carregamento da imagem do *Hero* trave a transição do envelope:
1. Durante as fases `SEALED` e `OPENING_FLAP`, um componente oculto inicia o pré-carregamento em cache das fotos principais (`new Image().src = heroUrl`).
2. Mantemos um esqueleto com efeito de brilho (*Shimmer*) renderizado na mesma proporção da foto real para mitigar qualquer *Cumulative Layout Shift (CLS)*.
3. A imagem do Hero só é renderizada opaca na fase `MORPH_FULL`, já puxada do cache instantaneamente.

---

## 2. Componente de Mural de Memórias Dinâmico (`<MuralMemoria />`)

O mural combina um layout assimétrico Masonry com comportamento dinâmico e interativo ("Mural Vivo").

### 2.1. Grid Misto & Embaralhamento Mágico
O catálogo renderizará uma coleção de itens recuperados do banco de dados, que podem ser do tipo `FOTO`, `MENSAGEM` ou `HIBRIDO` (mensagem sobreposta).

```typescript
interface MuralItem {
  id: string;
  tipo: 'FOTO' | 'MENSAGEM' | 'HIBRIDO' | 'VIDEO';
  urlMidia?: string;
  conteudoTextual?: string;
  autor?: string;
}
```

*   **Masonry Responsivo**: Implementado via subgrid CSS ou biblioteca como `react-masonry-css` para evitar colunas desalinhadas no mobile.
*   **Embaralhamento Mágico (Framer Motion `layoutId`)**:
    *   Um scheduler em segundo plano (`setInterval`) selecionará dois elementos aleatórios do array de estados a cada 8-10 segundos.
    *   Ao inverter seus índices no estado do React, o Framer Motion reordenará fisicamente os cards de forma automática e fluida usando o atributo `layout`, criando a animação "mágica" de flutuação e movimentação sem precisar recalcular layouts pesados.
    *   Durante a transição, aplicamos temporariamente um filtro de desfoque (`filter: blur(10px)`) nos elementos selecionados.

---

## 3. Catálogo de Presentes Premium com Carrinho (`<CatalogoPresentes />`)

A experiência de contribuição se comportará como um fluxo híbrido de e-commerce e afeto.

### 3.1. Estado do Carrinho (`CartContext`)
Implementaremos um contexto React global ou Zustand simples para gerenciar o acúmulo de presentes virtuais antes do checkout consolidado.

```typescript
interface CartItem {
  presenteId: string;
  quantidade: number;
  valorUnitario: number;
}

interface CartContextProps {
  items: CartItem[];
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalValue: number;
}
```

### 3.2. Ações Duplas no Modal de Detalhes
*   **Botão "Presentear Agora" (Checkout Direto)**: Desvia o fluxo diretamente para a API do Stripe/Gateway gerando o Pix/Card do item selecionado imediatamente.
*   **Botão "Adicionar ao Carrinho"**: Insere o item no `CartContext`, disparando uma micro-interação visual no botão e incrementando o badge flutuante de carrinho.
*   **Redirecionamento de Loja Externa**: Se o item for físico e possuir `link_externo` cadastrado no Supabase, o modal oculta os botões de checkout virtual e expõe o botão `↗ Comprar na Loja Indicada`, abrindo o respectivo link em nova aba (`_blank`).

---

## 4. Regras de Negócio & Modelagem de Banco de Dados (Supabase)

Para viabilizar a **Moderação de Fotos e Mensagens**, atualizaremos o esquema do banco de dados no Supabase.

### 4.1. Nova Tabela `mural_itens`
Armazenará as mídias e mensagens enviadas pelos convidados.

```sql
create table public.mural_itens (
  id uuid default gen_random_uuid() primary key,
  evento_id uuid references public.eventos(id) on delete cascade not null,
  tipo varchar(20) not null check (tipo in ('FOTO', 'MENSAGEM', 'HIBRIDO', 'VIDEO')),
  url_midia text, -- Null para mensagens puras. Recebe URL da imagem ou vídeo.
  mensagem text,  -- Null para mídias puras
  autor varchar(100),
  aprovado boolean default false not null, -- Regra de moderação crítica
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas e Limites de Upload de Vídeo:
-- - Formatos aceitos: MP4, MOV, WebM.
-- - Limite de tamanho recomendado: Max 15MB por vídeo para preservar banda de exibição.
-- - Compressão automática ativada via pipeline de upload do cliente antes do envio ao bucket.

-- Habilitar RLS
alter table public.mural_itens enable row level security;

-- Políticas de RLS
-- 1. Qualquer convidado pode inserir registros pendentes
create policy "Convidados podem submeter lembranças"
on public.mural_itens for insert
with check (true);

-- 2. Convidados só visualizam mídias previamente aprovadas
create policy "Público pode ver apenas lembranças aprovadas"
on public.mural_itens for select
using (aprovado = true);

-- 3. Organizadores/Admin possuem controle total (CRUD) sobre itens do seu evento
create policy "Organizadores possuem controle total de suas mídias"
on public.mural_itens for all
using (
  evento_id in (
    select id from public.eventos where organizador_id = auth.uid()
  )
);
```

### 4.2. Coluna `link_externo` na Tabela `presentes`
Garantiremos que a tabela de presentes possui suporte a links externos para redirecionamento.

```sql
alter table public.presentes 
add column if not exists link_externo text;
```

### 4.3. Estratégia de Suporte Multimídia na Hero (Sem Perder Dados Legados)
Para suportar o carrossel de fotos e vídeos na Hero do Convite sem perder as fotos cadastradas nos casamentos em andamento, adotaremos uma abordagem estritamente aditiva na tabela `configuracoes`:

1. **Adição da coluna `hero_videos`**: Criaremos uma coluna do tipo array de textos para armazenar exclusivamente as mídias de vídeo.
2. **Preservação de `hero_images`**: A coluna existente `hero_images` (que armazena as fotos atuais dos casamentos ativados) permanece intocada, evitando qualquer perda ou migração de dados complexa.
3. **No Front-End**: O componente unificará os itens de `hero_images` (imagens) e `hero_videos` (vídeos) em uma fila única de mídias para exibição cíclica com transição em cross-fade.

```sql
alter table public.configuracoes
add column if not exists hero_videos text[] default '{}';
```

---

## 5. Próximos Passos (Fase DEV)
1. **Migração**: Aplicar o script SQL de atualização de tabelas (mural_itens, link_externo, hero_videos) e políticas de RLS no Supabase.
2. **Mural & Hero Frontend**: Implementar a lógica unificada de mídia na Hero (Imagens + Vídeos com cross-fade) e os componentes `<EnvelopeDigital />` e `<MuralMemoria />` no Next.js usando Framer Motion.
3. **Gestão de Checkout**: Integrar `CartContext` e a renderização do catálogo de presentes físicos/virtuais.
4. **Painel Administrativo**: Integrar tela de configurações (`configuracoes-evento.html`) permitindo upload de fotos/vídeos para a Hero e moderação rápida de mídias pendentes dos convidados.
