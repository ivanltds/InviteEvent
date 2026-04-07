# PDR-001: Evolução para Plataforma de Eventos Genérica (EaaS)

## 📋 Resumo Executivo
Este documento formaliza a transição estratégica do MVP de Casamento para uma plataforma genérica de eventos ("Event-as-a-Service"). O foco inicial é garantir a estabilidade do MVP (Layslla e Marcus) e, em seguida, abstrair o núcleo para suportar multi-tenancy e modularidade.

## 🎯 Objetivos Estratégicos
1. **Estabilização do MVP:** Conclusão dos itens de UX, Responsividade e Identidade Visual.
2. **Des-casamentização:** Migração do banco de dados de um modelo fixo ("Noivos") para um modelo genérico ("Anfitriões/Entidades").
3. **Escalabilidade:** Implementação de Multi-tenancy real via `evento_id`.
4. **Diferenciação via IA:** Uso de LLMs para geração de conteúdo e auxílio na gestão do evento.

## 🛠️ Plano de Implementação (Timeline)

### Fase 1: Finalização do MVP (Imediato)
*   **Ação:** Concluir EPIC-004 (UX) e EPIC-007 (Visual).
*   **Meta:** Site responsivo, touch targets otimizados e temas dinâmicos via `:root` CSS.

### Fase 2: Abstração de Core (Horizonte Curto) - EPIC-011
*   **Ação:** Refatoração de Schema. Transição de `configuracoes` (ID=1) para `eventos` (Multi-ID).
*   **Ação:** Injeção de `evento_id` em `convites`, `rsvp` e `presentes`.

### Fase 3: Modularidade e IA (Horizonte Médio)
*   **Ação:** Implementação de "Lego" de blocos (História, Presentes, Mural) via Feature Flags.
*   **Ação:** Integração com APIs de LLM para redação automática e FAQ inteligente.

## 🧱 Arquitetura de Referência
*   **Banco de Dados:** PostgreSQL (Supabase) com RLS baseado em `evento_id` + `owner_id`.
*   **Frontend:** Next.js com Design Tokens para temas específicos por tipo de evento.
*   **IA:** Agentes orquestrados para geração de conteúdo e curadoria de dados.

## ⚠️ Riscos e Mitigações
*   **Risco:** Quebra de compatibilidade com o site atual de Layslla e Marcus.
*   **Mitigação:** Versionamento de API e migrações SQL com scripts de rollback testados.
*   **Risco:** Diluição de marca (parecer genérico demais).
*   **Mitigação:** Verticalizações estéticas via CSS Variables injetadas por tipo de evento.

---
**Status:** ✅ APROVADO PARA EXECUÇÃO (PM/PO/SM)
**Data:** 06/04/2026
