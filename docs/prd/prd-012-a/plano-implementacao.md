# Plano de Implementação Técnica: Smart Gift List — Bloco A: Fundação
> **Fase:** ARQUITETURA -> DEV -> QA -> CONCLUÍDO (PRD-012-A)  
> **Autor:** @architect & @dev  
> **Status:** 🏆 CONCLUÍDO E CERTIFICADO PELO QA  

Este documento divide a implementação da Fundação Inteligente em entregáveis atômicos orientados à TDD, facilitando a execução pelos agentes @dev e @ai-eng.

---

## 📑 Resumo das Entregas

1.  **Sprint 1: Banco & Seed (Backend)**: DDL das tabelas, políticas RLS e script de povoamento com 20 itens SaaS canônicos. ✅ [CONCLUÍDO]
2.  **Sprint 2: O Motor Dinâmico (Rankings)**: Criação da View de cálculo de peso ponderado para categorias e as rotas de API. ✅ [CONCLUÍDO]
3.  **Sprint 3: UI Cockpit do Casal (Frontend)**: Reformulação das 3 abas do admin, cards uniformizados com modal de detalhes e clonagem rápida. ✅ [CONCLUÍDO]

---

## 🛠️ Sprint 1: Banco de Dados & Segurança

### Tarefa 1.1: Migration SQL - Estrutura e RLS
*   **Arquivo:** Criar nova migration em `supabase/migrations/XXXXXXXXXXXXXX_add_smart_gift_foundation.sql`.
*   **Objetivo:** Executar a DDL mapeada no documento de [Arquitetura Técnica](arquitetura.md).
*   **🚨 REGRA DE OURO DE PRODUÇÃO:** As colunas `categoria_id` e `base_id` DEVEM ser `NULLABLE` para não quebrar nenhum registro do casal que já está ativo no ar.
*   **Checklist:**
    *   [x] Criar `public.presentes_categorias` (slug, nome, ordem).
    *   [x] Criar `public.presentes_base` (FK categoria_id).
    *   [x] Alterar `public.presentes` inserindo as colunas `categoria_id` e `base_id` com `DEFAULT NULL`.
    *   [x] Configurar RLS blindado: leitura pública para categorias, autenticada para base, alterações só para administradores Master.

### Tarefa 1.2: O Grande Script de Seed
*   **Objetivo:** Povoar a base de produção/desenvolvimento com dados de luxo imediatamente.
*   **Seed de Categorias:** Inserir exatamente 8 categorias: ✅ [CONCLUÍDO]
    1.  `cozinha-utensilios` - Cozinha & Utensílios
    2.  `eletrodomesticos` - Eletrodomésticos
    3.  `cama-mesa-banho` - Cama, Mesa & Banho
    4.  `decoracao-organizacao` - Decoração & Organização
    5.  `lazer-bar-churrasco` - Lazer, Bar & Churrasco
    6.  `eletronicos-tecnologia` - Eletrônicos & Tecnologia
    7.  `moveis` - Móveis
    8.  `viagem-lua-mel` - Viagem, Cotas & Lua de Mel
*   **Seed de Presentes Base:** Criar no mínimo 20 itens canônicos com imagens reais em HD (Unsplash), descrições técnicas e parceiros atribuídos (Ex: Batedeira KitchenAid, Liquidificador Philips Walita, Cota Jantar Romântico). ✅ [CONCLUÍDO]

---

## 📊 Sprint 2: Motor de Ordenação & APIs

### Tarefa 2.1: View de Ranking Dinâmico
*   **Objetivo:** Disponibilizar uma view consolidada para ordenação das categorias por evento.
*   **Lógica SQL:** ✅ [IMPLANTADO VIA VIEW public.view_presentes_categoria_ranking]

### Tarefa 2.2: Servidor de Clonagem em 1-Clique
*   **Objetivo:** Prover a API de importação do item SaaS para o casal.
*   **Endpoint/Action:** Criar um Server Action `importGiftFromBase(baseId: string, eventoId: string)`. ✅ [IMPLEMENTADO NO src/lib/services/giftService.ts]

---

## 🎨 Sprint 3: UI & Experiência Consolidada

### Tarefa 3.1: Unificação de Navegação e Renomeação
*   **Destino:** `src/app/(admin)/admin/presentes/page.tsx`
*   **Ação:** Redesenhar o seletor de abas do sistema administrativo de presentes. ✅ [CONCLUÍDO COM 3 ABAS FLUIDAS]

### Tarefa 3.2: Engenharia de Cards Uniformizados (Com Hover Details)
*   **Objetivo:** Aplicar o botão flutuante "Ver Detalhes" em ambas as abas de cards. ✅ [CONCLUÍDO]
*   **🚨 TRATAMENTO DE DADOS LEGADOS:** No loop que renderiza os cards da aba 'Gestão', garantir que itens que vieram sem `categoria_id` do banco (presentes antigos de casamentos ativos) sejam renderizados graciosamente com um badge padrão. ✅ [IMPLEMENTADO NULL SAFE COM `Geral`]
*   **Modal Atualizado:** Adicionar o Bloco de Loja do Parceiro que renderiza uma âncora funcional caso o presente tenha `link_externo` / `link_varejo_padrao` configurado. ✅ [CONCLUÍDO COM INTEGRAÇÃO DE CATEGORIAS E MODAL DE DETALHES SAAS]

### Tarefa 3.3: O Widget de Recomendações Diárias
*   **Objetivo:** Exibir a sugestão lateral na nova tela administrativa. ✅ [CONCLUÍDO COM RENDERIZADOR DETERMINÍSTICO E CLONAGEM RÁPIDA]

---

## ✅ Critérios de Certificação Final (QA Hand-Off)

*   [x] O casal consegue navegar pelas 3 abas fluidamente.
*   [x] Clicar em Adicionar na vitrine SaaS aciona a inserção instantânea no banco de dados local e atualiza o contador da aba principal de Gestão.
*   [x] Itens importados mantêm o `base_id` preenchido no Supabase.
*   [x] A View de ranking reordena as categorias do evento em tempo real à medida que o teste simula clicks e arrecadações.
*   [x] O cadastro e a edição manual de presentes agora suportam atribuição e persistência taxonômica de categorias globais.
*   [x] Suíte de Testes E2E Playwright (`tests/e2e/prd_012a_smart_gift.spec.ts`) criada e com 100% de aprovação nas validações de UI e fluxo crítico de navegação.

