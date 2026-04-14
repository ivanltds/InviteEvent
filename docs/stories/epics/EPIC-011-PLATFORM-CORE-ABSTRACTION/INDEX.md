# EPIC-011: Abstração de Core para Plataforma (Event-as-a-Service)

## Status: 🟢 MOSTLY DONE (7/9 DONE)

## Descrição
Este épico foca em "des-casamentizar" o motor do sistema, permitindo que o InviteEventAI suporte múltiplos eventos simultâneos e diferentes tipos de celebração (aniversários, chás, festas).

## Histórias (Stories)
- [x] **STORY-037:** Landing Page de Vendas e Abstração de Rotas. -> **✅ DONE** (Landing SaaS + `/inv/[slug]`)
- [x] **STORY-041:** Dashboard Consolidado de Eventos. -> **✅ DONE** (Listagem multi-evento + EventContext)
- [x] **STORY-042:** Fluxo de Criação de Novo Casamento. -> **✅ DONE** (Criação atômica: eventos + organizadores + config)
- [x] **STORY-046:** Onboarding Wizard Multi-Step. -> **✅ DONE** (OnboardingWizard.tsx integrado ao dashboard)
- [x] **STORY-047:** Navegação em Camadas. -> **✅ DONE** (Sidebar com context switcher + mobile collapse)
- [x] **STORY-048:** Dashboard de Métricas do Evento. -> **✅ DONE** (Cards de resumo + atividades recentes)
- [x] **STORY-032:** Gestão de Membros Multi-Organizador. -> **✅ DONE** (`/admin/equipe` com CRUD completo)
- [ ] **STORY-033:** Abstração de Entidades Principais via Metadados JSONB. -> **📋 BACKLOG**
- [ ] **STORY-034:** Feature Flags por Evento (Ativação Modular de Recursos). -> **📋 BACKLOG**
- [ ] **STORY-051:** Deploy & CI/CD Pipeline (Vercel). -> **📋 TODO**
- [ ] **STORY-059:** Observabilidade em Produção (Vercel Analytics + DB Monitoring). -> **📋 BACKLOG**

## Notas de Arquitetura

