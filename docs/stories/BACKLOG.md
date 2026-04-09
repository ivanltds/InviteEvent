# Projeto Casamento: Backlog Priorizado (Pax - PO)

## Overview
Este backlog contém as histórias de usuário restantes, organizadas por prioridade técnica e de negócio para garantir o sucesso do evento e a segurança dos dados.
## 🔝 PRIORIDADE 1: Segurança & Integridade (Hardening)
*Foco: Proteger o admin e os dados dos casais.*

1. **[EPIC-010] STORY-039: Migração para Supabase Auth & Isolamento**
   - **Por que:** A senha fixa é insegura. Precisamos de login real e vínculo de propriedade (Owner).
   - **Status:** ✅ DONE 🏆

2. **[EPIC-010] STORY-027: Autenticação Server-Side para Admin**
   - **Por que:** Proteção via Middleware e Cookies seguros (Depende da 039).
   - **Status:** ✅ DONE 🏆

3. **[EPIC-010] STORY-029: Auditoria e Refinamento de RLS (Supabase)**
   - **Por que:** Garantir que um casal não acesse dados de outro.
   - **Status:** Draft

4. **[CORE] STORY-040: Cobertura de Testes Unitários do Core**
   - **Por que:** Garantir estabilidade dos helpers de Code Intel e automação.
   - **Status:** ✅ DONE 🏆

---

## ⚡ PRIORIDADE 2: Experiência & Evolução (SaaS Ready)
*Foco: Valor percebido e suporte a múltiplos casamentos.*

5. **[EPIC-011] STORY-037: Landing Page & Abstração de Rotas**
   - **Por que:** Separar marketing do convite privado `/inv/[slug]`.
   - **Status:** ✅ DONE 🏆

6. **[EPIC-011] STORY-032: Migração Final Multi-tenancy**
   - **Por que:** Finalizar o isolamento total de dados no banco (PKs ajustadas).
   - **Status:** 🛠️ In Progress

---

## 📋 Resumo do Estado Atual
- **Epics Finalizados:** EPIC-001, EPIC-002, EPIC-003, EPIC-004, EPIC-005, EPIC-006, EPIC-007.
- **Próximo Passo Imediato:** Iniciar STORY-027 (Server-side Auth).
