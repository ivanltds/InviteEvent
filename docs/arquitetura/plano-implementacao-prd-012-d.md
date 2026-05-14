# Plano de Implementação Técnica — Cockpit de Gestão Global de Presentes (PRD-012-D)

Este documento detalha o plano arquitetural e a esteira de engenharia para a materialização do módulo administrativo **Global Gift Management Cockpit (Fase D)**. A solução permite que administradores do ecossistema (`is_master = true`) auditem, criem, editem e controlem globalmente o catálogo base de presentes integrados no SaaS.

---

## 🏗️ 1. Arquitetura de Dados (Supabase Migrations)

### 💾 1.1 Alterações na Tabela `public.presentes_base`
A tabela de catálogo de presentes atual (`public.presentes_base`) não armazena o ciclo de vida administrativo. Devemos adicionar as seguintes propriedades via DDL SQL:

*   `is_paused` (`boolean`, padrão `false`): Permite suspender o item de novas importações instantaneamente.
*   `is_archived` (`boolean`, padrão `false`): Mecanismo de **Soft-Archive** para proteção de histórico de recebidos.

```sql
-- Adiciona flags administrativas no Catálogo Base
ALTER TABLE public.presentes_base 
ADD COLUMN is_paused BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN is_archived BOOLEAN DEFAULT false NOT NULL;

-- Garante indexação para buscas de inventário filtradas por arquivamento (desempenho)
CREATE INDEX idx_presentes_base_ativo_arquivado ON public.presentes_base(is_archived) WHERE is_archived = false;
```

### 🛡️ 1.2 Hardening de Políticas RLS (Segurança)
A segurança do catálogo global deve ser estrita, garantindo que apenas operadores mestres possam modificar dados base.

```sql
-- Remove políticas de escrita legadas se existirem
DROP POLICY IF EXISTS "Somente Master grava catalogo base" ON public.presentes_base;

-- Cria política robusta associada à coluna is_master da tabela perfis
CREATE POLICY "Master CRUD Total no Catalogo Base"
ON public.presentes_base
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfis
    WHERE perfis.id = auth.uid() AND perfis.is_master = true
  )
);
```

### 📊 1.3 Visão Computada para Métricas de Auditoria (`view_presentes_base_metricas`)
Para alimentar de forma performática a contagem de "Casamentos Ativos" demandada pelo usuário, implementaremos uma `VIEW` otimizada.

```sql
CREATE OR REPLACE VIEW public.view_presentes_base_metricas AS
SELECT 
    pb.*,
    cat.nome as categoria_nome,
    COUNT(DISTINCT p.evento_id) FILTER (WHERE e.is_active = true) as casamentos_ativos,
    COUNT(DISTINCT c.id) as total_recebidos
FROM 
    public.presentes_base pb
LEFT JOIN public.presentes_categorias cat ON pb.categoria_id = cat.id
LEFT JOIN public.presentes p ON p.base_id = pb.id
LEFT JOIN public.eventos e ON p.evento_id = e.id
LEFT JOIN public.comprovantes c ON c.presente_id = p.id
WHERE 
    pb.is_archived = false
GROUP BY 
    pb.id, cat.nome;
```

---

## 🌐 2. Camada de APIs (API Routes — Next.js App Router)

Criaremos o endpoint centralizador em `/src/app/api/admin/catalogo/route.ts` e submódulos para controlar os ciclos de vida.

### 🛠️ 2.1 Operações CRUD Básicas (`GET`, `POST`, `PATCH`)
*   `GET`: Retorna a lista de presentes agregada via `view_presentes_base_metricas` com paginação básica e filtros.
*   `POST`: Criação de novo presente base no banco (requer payload com nome, preço, etc.).
*   `PATCH`: Atualização pontual (usado tanto para salvar alterações gerais de edição quanto para o gatilho rápido de Pausar).

### 🗑️ 2.2 Mecanismo "Safe Global Delete" (Delete com Tratativa Histórica)
Uma das regras críticas do PRD é **nunca destruir auditorias financeiras**. A exclusão seguirá o seguinte fluxo na API Route:
1.  Verificar se há registros vinculados na tabela `public.comprovantes` (presentes já dados/recebidos por convidados) atrelados a instâncias do item base.
2.  **Cenário A (Com Vínculo Financeiro):** A API não exclui fisicamente. Ela seta `is_archived = true` e remove o item de novas importações, retornando feedback: *"O item possuía registros históricos e foi arquivado em segurança para fins de auditoria"*.
3.  **Cenário B (Sem Vínculo):** Realiza a exclusão em cascata (Hard Delete) de instâncias não presenteadas nas listas e do item base final.

### ⚙️ 2.3 Enfileiramento de CuraIA Massivo (`/bulk-curate`)
*   **POST**: Endpoint recebe um gatilho e faz a inserção massiva de todos os itens listados (ou filtrados) na tabela `public.fila_ajuste_links` com status `PENDENTE`, permitindo que o Daemon de Self-Healing os cure no próximo ciclo.

---

## 🗺️ 3. Rotas e Navegação do Sistema

Integrar o novo módulo nas trilhas do Next.js de forma invisível para usuários normais e acessível a administradores.

### 🧩 3.1 Configuração do Shell do Layout (`AdminLayoutClient.tsx`)
*   Inserir o path `/admin/catalogo` dentro do array helper `isGlobalPlatformRoute` para que a plataforma configure o tema **Admin Theme Dark (Luxo Preto)** de forma nativa na inicialização da página.

### 🧭 3.2 Adição na Sidebar Gerencial (`Sidebar.tsx`)
*   Adicionar o item **"Catálogo Global"** dentro da lista `platformItems` (camada gerencial), controlando visibilidade com `show: isMaster`.

---

## 🎨 4. Implementação da Interface de Usuário (Next.js / CSS Modules)

Recriaremos toda a fidelidade visual premium testada e assinada pelo usuário no wireframe `master-gestao-presentes.html` dentro da aplicação de produção.

### 📁 4.1 Estruturação de Pastas e Arquivos
```bash
src/app/(admin)/admin/catalogo/
├── page.tsx                       # Ponto de entrada e container de estado React
├── CatalogoGlobal.module.css      # Estilos locais baseados na estética preta de luxo
└── components/                    # Subcomponentes de tela reaproveitáveis
    ├── CardKpi.tsx                # Cartão com badges de status (Total, Amazon, Quebrados)
    ├── GridVisualizacao.tsx       # Toggle entre Tabela Admin e Grid de Cards com Blur Overlay
    └── ModaisDashboard/           # Modais de Detalhe, Excluir Seguro e Fila de Cura
```

### ✨ 4.2 Destaques e Dinâmicas de UX Implementados
1.  **🎨 Grid e Hover Visual:** Refazer o `.viewDetailsOverlay` e `.detailsBtn` como tokens de estilos React, garantindo que o botão branco cápsula de "Ver Mais" anime suavemente.
2.  **💎 Tags Flutuantes:** Renderizar badges "Light Glass" dinamicamente com cores chapadas baseadas no status do registro vindo da API do Supabase.
3.  **📢 Modais e Toasts Próprios:** Reaproveitar o sistema nativo de Feedback e Dialogs do Next.js do projeto, aplicando o overlay preto translúcido e a animação de Toast lateral para PAUSAR e FILA DE CURA.
4.  **🖼️ Tratamento Off-line de Imagens:** Injetar a função Javascript `handleImgError` validada que insere SVG Inline do tipo DataURI quando imagens externas de parceiros falharem em produção, livrando o console de erros de conexões recusadas.

---

## 🧪 5. Estratégia de Validação e QA

Para homologar a entrega, a esteira executará:
1.  **Teste de RLS**: Tentar realizar operações de INSERT/PATCH no catálogo global com usuário de privilégio normal (deve retornar 403/erro RLS).
2.  **Teste de Safe Delete**: Realizar tentativa de exclusão de um presente que já recebeu pagamentos fictícios (deve atestar que virou `is_archived = true` sem sumir das tabelas financeiras).
3.  **Simulação de View**: Testar via browser a alternância "Cards <> Tabela" garantindo que o estado de visualização e filtros se propague sem glitches ou re-renderizações destrutivas.
