# 🏗️ Plano de Implementação Técnica: Cérebro Autônomo & Self-Healing (PRD-012-C)

> **Status:** AGUARDANDO DESENVOLVIMENTO (Fase DEV)  
> **Autor:** Arquiteto de Software (`@architect`)  
> **Contexto:** Automação de Catálogo, Recuperação de Links Quebrados e Conciliação Lomadee Offline.

---

## 1. Arquitetura de Dados e Segurança

Nesta fase, provisionaremos duas novas tabelas operacionais e blindaremos o acesso de escrita e leitura através de Políticas RLS do Supabase.

### A. Tabelas do Supabase (DDL)
```sql
-- ============================================================================
-- 1. TABELA: public.watchlist_itens
-- Monitoramento diário de menor preço SaaS no catálogo base.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.watchlist_itens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    presente_base_id uuid REFERENCES public.presentes_base(id) ON DELETE CASCADE,
    preco_base_original numeric NOT NULL,
    menor_preco_encontrado numeric,
    loja_campea text,
    link_parceiro_atual text,
    frete_estimado numeric DEFAULT 0.00,
    ultima_verificacao timestamptz DEFAULT now(),
    criado_em timestamptz DEFAULT now()
);

-- Habilita RLS (Apenas Master controla a lista)
ALTER TABLE public.watchlist_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Master controle total watchlist" 
ON public.watchlist_itens FOR ALL
USING (EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true));

-- ============================================================================
-- 2. TABELA: public.fila_ajuste_links
-- Fila de erros de links e histórico de Self-Healing.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fila_ajuste_links (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    presente_base_id uuid REFERENCES public.presentes_base(id) ON DELETE SET NULL,
    presente_id uuid REFERENCES public.presentes(id) ON DELETE SET NULL,
    link_quebrado text NOT NULL,
    motivo_quebra text NOT NULL, -- 'HTTP_404', 'ESTOQUE_ESGOTADO', 'ERRO_INTERNO'
    status text NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'PROCESSANDO', 'CURADO', 'FALHA_MANUAL'
    link_substituto text,
    logs_cura jsonb DEFAULT '[]'::jsonb,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

-- Habilita RLS (Público insere via links rotos, Master administra)
ALTER TABLE public.fila_ajuste_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um reporta links quebrados"
ON public.fila_ajuste_links FOR INSERT
WITH CHECK (true);

CREATE POLICY "Master le e atualiza fila"
ON public.fila_ajuste_links FOR ALL
USING (EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true));

-- Trigger para atualização de timestamp 'atualizado_em'
CREATE OR REPLACE FUNCTION update_fila_ajuste_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.atualizado_em = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trg_update_fila_ajuste
BEFORE UPDATE ON public.fila_ajuste_links
FOR EACH ROW EXECUTE FUNCTION update_fila_ajuste_timestamp();
```

---

## 2. Engenharia do Ciclo de Monetização (Fluxo de Cliques)

### A. Tokenização de Cliques e Rastreamento (Afiliados)
Substituiremos o redirecionamento direto por uma operação atômica de gravação de telemetria antes do redirecionamento externo.

**Arquivos Impactados:**
*   `src/components/gifts/GiftModal.tsx` / `src/app/(public)/presentes/page.tsx`
*   `src/services/analyticsService.ts` (ou similar)

**Passo a Passo Técnico:**
1.  No clique do botão "Comprar Online":
    *   Gera um token criptográfico/único: `const token = 'AEG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();`
    *   Salva na tabela `analytics_events` com as colunas:
        *   `categoria`: 'gift'
        *   `evento_tipo`: 'clique_loja'
        *   `target_id`: `presente.id`
        *   `metadata`: `{ "token": token, "link_destino": presente.link_externo }`
    *   Executa o redirecionamento Lomadee anexando `&sourceId=${token}` à URL final do parceiro.

---

## 3. O Daemon de Inteligência (@catalog-expert)

Criaremos uma rota interna segura em Next.js API Route que atua como o cérebro de automação.

**Arquivos Criados/Modificados:**
*   `src/app/api/intelligence/autonomy/daemon/route.ts` (API de Processamento)
*   `src/services/giftService.ts` (Novos métodos de persistência da Fila)

**Comportamento do Daemon:**
1.  Lê todas as linhas em `fila_ajuste_links` onde `status = 'PENDENTE'`.
2.  Para cada item:
    *   Altera status para `PROCESSANDO`.
    *   Extrai o `presente_base_id` e lê o Nome / EAN.
    *   Consulta o Agente de IA `@catalog-expert` via OpenAI GPT para pesquisar um produto real, ativo e de baixo custo (compatível com título/categoria/preço).
    *   Executa um Ping (HEAD request) na URL gerada pela IA para certificar integridade física.
    *   **Caso encontre:** Atualiza o link substituto real, grava os logs estruturados JSON de auditoria da IA e define status como `CURADO`. Propaga o novo link ativo para `presentes_base` e atualiza todos os clones dinâmicos vinculados em `presentes` na vitrine de eventos.
    *   **Caso falhe:** Registra erro factual e marca como `FALHA_MANUAL` para revisão.

---

## 4. Cockpit Master: Aba de Automação e Upload CSV

Modificaremos o cockpit real de Master Intelligence para adicionar a terceira aba desenhada no Wireframe de Experiência.

**Arquivos Impactados:**
*   `src/app/(admin)/admin/intelligence/page.tsx`
*   `src/app/(admin)/admin/intelligence/Intelligence.module.css`

**Componentes a Implementar:**
1.  **Mapeador de Abas**: Adicionar a aba `cura` na interface reativa do React.
2.  **Painel de Fila de Ajuste**: Grid exibindo os registros da tabela `fila_ajuste_links` com filtros e um Modal deslizante (Framer Motion) para renderizar o histórico JSON formatado como terminal de logs.
3.  **Área de Drag-and-Drop CSV**:
    *   Widget que aceita upload de arquivo `.csv`.
    *   Chama a rota `src/app/api/intelligence/reconcile/route.ts`.
    *   Esta API varre as linhas do CSV, isola a coluna `sourceId` (nosso token) e a coluna de comissão, busca no Supabase o evento em `analytics_events` via query JSONB `metadata->>'token'` e retorna o total conciliado para ser somado instantaneamente ao faturamento na tela com animação visual.

---

## 5. Plano de Testes Automatizados (Qualidade Contínua)

### A. Testes Unitários & Integração (Jest)
**Arquivo de Teste:**
*   `src/__tests__/linkGuard.test.ts`

**Validações Cobertas (100% GREEN):**
-  Simulação de ausência de URL na chamada de API (Erro 400).
-  Comportamento em links saudáveis (Retorna 200 ➡️ Declara `valid: true`).
-  Comportamento em links quebrados (Retorna 404 ➡️ Declara `valid: false`).
-  Comportamento em falhas de rede/DNS (ENOTFOUND ➡️ Declara `valid: false`).
-  Mecanismo fail-safe em erros misteriosos (Garante pass-through declarando `valid: true`).

### B. Testes End-to-End (Playwright)
**Arquivo de Teste:**
*   `tests/e2e/prd_012c_cerebro_autonomo.spec.ts`

**Cenários de Validação:**
1.  **Cenário A (Detecção e Fila)**: 
    Simular um clique de convidado que retorna erro 404 ➡️ Verificar se uma nova linha `PENDENTE` surgiu na tabela `fila_ajuste_links`.
2.  **Cenário B (Self-Healing em Lote)**: 
    Fazer requisição POST para `/api/intelligence/autonomy/daemon` ➡️ Verificar se os registros de teste mudaram para `CURADO` e atualizaram a URL base.
3.  **Cenário C (Reconciliação Offline)**: 
    Fazer upload de um Mock CSV via seletor HTML de testes ➡️ Verificar se o total de receita na tela subiu com a margem exata de comissão das linhas correspondentes.

---

## 6. Adendo de Arquitetura: Pre-Flight Link Guard (Proteção Contra 404)

Para prevenir que convidados saiam do fluxo da aplicação e caiam em uma tela de 404 externa ao clicar em links quebrados de afiliados, implementaremos uma camada ativa de interceptação.

### A. Componentes a Criar:
1.  **API de Validação**: `src/app/api/intelligence/autonomy/validate/route.ts`
    - Executa um disparo GET simulado no servidor com timeout máximo de 3.0s.
    - Reporta `{ valid: false }` em caso de erro HTTP 404, 410 ou falha de resolução de DNS (`ENOTFOUND`).
2.  **UI na Vitrine**: `src/app/(public)/presentes/page.tsx`
    - Durante a exibição da tela intersticial de 4s, dispara a chamada de API.
    - Se acusar erro, **interrompe a redireção automática**, aciona silenciosamente `giftService.reportBrokenLink(...)` para popular a fila e altera o visual para a contingência.
    - **Transacionalidade do Bloqueio**: Libera instantaneamente o lock temporário via `giftService.unlockGift(...)` e limpa a reserva otimista na memória da vitrine, garantindo que o item continue livre para outros convidados presentearem.

### B. Cópia do Texto de Contingência (Regra do Operador: Sem menção a IA):
- **Título:** 🛡️ Ajuste de Rota Inteligente
- **Conteúdo:** *"Detectamos que o link deste parceiro está temporariamente indisponível. O alerta automático do portal foi acionado e o link será restaurado o quanto antes. Enquanto realizamos o ajuste técnico, você pode presentear com 1-clique via PIX de forma 100% segura."*
- **CTAs:** Botão elegante para iniciar o Pix Direto do item e opção de Fechar.
