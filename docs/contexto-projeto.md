# Contexto do Projeto — Maestro
> ÍNDICE CENTRAL. Máximo 300 linhas.
> Todo agente lê ao iniciar. Todo agente atualiza ao criar arquivos.

## Projeto
InviteEventAI - Plataforma SaaS para Convites e Gestão de Eventos

## Objetivo de Negócio
Oferecer uma solução completa e elegante para noivos e organizadores gerenciarem convites digitais, RSVP e listas de presentes.

## Stack
- Frontend  : Next.js 16 (App Router), TypeScript, Framer Motion
- Backend   : Node.JS (Next API Routes)
- Banco     : Supabase (PostgreSQL + RLS + RPC)
- Infra     : Vercel, Cloudinary (Imagens), Stripe (Pagamentos)
- Testes    : Jest, Playwright

## Estrutura de Pastas
| Pasta                       | Propósito                                  |
|-----------------------------|--------------------------------------------|
| .gemini/agents/             | Definição dos agentes                      |
| .gemini/melhoria-continua/  | Aprendizados incrementais por agente       |
| docs/contexto-projeto.md    | Este índice central                        |
| docs/prd/                   | PRDs por demanda                           |
| docs/arquitetura/           | Documentação arquitetural                  |
| docs/design-system/         | Design system                              |
| docs/deploys/               | Histórico de deploys                       |
| docs/seguranca/             | Relatórios e checklists de segurança       |
| src/app/(public)            | Rotas de convidados (convite, presentes)   |
| src/app/(admin)             | Painel administrativo do organizador       |
| supabase/migrations/        | Evolução do esquema do banco de dados      |

## PRDs
| ID  | Nome                             | Status      | Fase Atual  |
|-----|----------------------------------|-------------|-------------|
| 001 | Consolidação MVP e Estabilização | CONCLUÍDO   | Concluído   |
| 002 | Nova UI                          | CONCLUÍDO   | Concluído   |
| 003 | Gestão do Master e Suporte Chat  | CONCLUÍDO   | Concluído   |
| 004 | Shielding & Security Gateway     | CONCLUÍDO   | Concluído   |
| 005 | Data Shielding & Soft Delete     | CONCLUÍDO   | Concluído   |
| 006 | Unificação Design System & Grids | CONCLUÍDO   | Concluído   |
| 010 | Multi-Animação de Gateways       | CONCLUÍDO   | Concluído   |

## Segurança
- **Última Auditoria:** 2024-05-24
- **Status:** Vulnerabilidades Críticas Corrigidas (v7/v8 RLS Fix)
- **Documentos:**
  - [Relatório de Segurança](docs/seguranca/relatorio-seguranca.md)
  - [Backlog de Segurança](docs/seguranca/backlog-seguranca.md)

## Arquivos Registrados
| Arquivo                                    | Responsável | Descrição                          |
|--------------------------------------------|-------------|------------------------------------|
| GEMINI.md                                  | Sistema     | Instruções globais                 |
| README-AGENTS.md                           | Sistema     | Guia de uso                        |
| .gemini/settings.json                      | Sistema     | Config do Gemini CLI               |
| docs/contexto-projeto.md                   | Sistema     | Índice central                     |
| docs/arquitetura/arquitetura-atual.md      | Arquiteto   | Visão técnica e decisões           |
| docs/arquitetura/plano-implementacao-prd-001.md | Arquiteto | Plano técnico para Mural, Presentes e RSVP |
| docs/arquitetura/plano-implementacao-prd-002.md | Arquiteto | Plano de arquitetura técnica da Nova UI|
| docs/arquitetura/plano-implementacao-fase-estabilizacao.md | Arquiteto | Plano de correções e segurança |
| docs/arquitetura/analise-riscos-banco-compartilhado.md | Arquiteto | Gestão de riscos para ambiente com banco único (Dev/Prod)|
| scratch/architect-report.md                | Arquiteto   | Relatório detalhado de análise     |
| docs/prd/prd-001/prd-inicial.md            | BA          | PRD de consolidação e backlog prioritário |
| docs/prd/prd-001/prd-refinado.md           | BA          | PRD refinado com User Stories e critérios de aceite |
| docs/prd/prd-001/fluxo-ux.md               | UX/UI       | Mapeamento de fluxos e telas       |
| docs/design-system/design-system.md        | UX/UI       | Design System (Cores, Tipografia)  |
| docs/stories/story-001-fluxos.md           | UX/UI       | Jornadas do usuário detalhadas     |
| wireframes/dashboard-admin.html            | UX/UI       | Wireframe do painel administrativo |
| wireframes/rsvp-flow.html                  | UX/UI       | Wireframe do fluxo de RSVP (Mobile)|
| wireframes/gift-list.html                  | UX/UI       | Wireframe da lista de presentes    |
| wireframes/mural-fotos.html                | UX/UI       | Wireframe do mural de fotos        |
| docs/seguranca/relatorio-seguranca.md      | Arquiteto   | Mapeamento de riscos e vulnerabilidades |
| docs/seguranca/backlog-seguranca.md        | Arquiteto   | Tabela de acompanhamento de riscos |
| docs/seguranca/checklist-seguranca.md      | Arquiteto   | Plano de ação corretiva            |
| docs/deploys/automacao-supabase.md         | DevOps      | Guia para automação total de DB    |
| docs/prd/prd-002/prd-inicial.md            | BA          | PRD inicial da Nova UI             |
| docs/prd/prd-002/fluxo-ux.md               | UX/UI       | Mapeamento de fluxos e telas (Nova UI)|
| docs/arquitetura/plano-implementacao-prd-002.md | Arquiteto | Plano de arquitetura técnica da Nova UI|
| docs/wireframes/envelope-digital.html      | UX/UI       | Wireframe do Envelope Digital Animado |
| docs/wireframes/galeria-fotos.html         | UX/UI       | Wireframe do Mural Vivo de Lembranças |
| docs/wireframes/landing-page.html          | UX/UI       | Wireframe da Landing Page Cinematográfica |
| docs/wireframes/lista-presentes.html       | UX/UI       | Wireframe da Lista de Presentes Premium|
| docs/wireframes/configuracoes-evento.html  | UX/UI       | Wireframe das Configurações do Evento e Mídias |
| docs/wireframes/suporte-chat.html          | UX/UI       | Wireframe do botão flutuante e gaveta de chat (usuário)|
| docs/wireframes/master-suporte.html        | UX/UI       | Wireframe da central de tickets e dashboard do Master Admin|
| docs/prd/prd-003/prd-inicial.md            | BA          | PRD inicial de Gestão do Master e Atendimento por Chat|
| docs/prd/prd-003/fluxo-ux.md               | UX/UI       | Mapeamento de fluxos e telas de Atendimento Chat|
| docs/prd/prd-003/fase-1-red.md             | DEV / QA    | Relatório do TDD de Suporte em phase RED (Falha Controlada)|
| docs/prd/prd-003/fase-1-green.md           | DEV / QA    | Relatório do TDD de Suporte em phase GREEN (Sucesso de Validação)|
| docs/prd/prd-003/fase-2-green.md           | DEV / QA    | Relatório do TDD de Suporte em fase GREEN (Sucesso de Renderização & UI)|
| docs/arquitetura/plano-implementacao-prd-003.md | Arquiteto | Plano de arquitetura técnica de suporte por Chat (SLA 2h)|
| docs/arquitetura/plano-implementacao-prd-003-fase-1.md | Arquiteto | Plano de implementação técnica detalhado da Fase 1 (Banco & APIs)|
| docs/arquitetura/plano-implementacao-prd-003-fase-2.md | Arquiteto | Plano de implementação técnica detalhado da Fase 2 (Widget & SLA)|
| docs/prd/prd-003/fase-3-red.md             | DEV / QA    | Relatório do TDD de Suporte em fase RED (Painel do Master)|
| docs/prd/prd-003/fase-3-green.md           | DEV / QA    | Relatório do TDD de Suporte em fase GREEN (Sucesso de Status)|
| docs/prd/prd-003/fase-4-red.md             | DEV / QA    | Relatório do TDD de Suporte em fase RED (Dashboard & KPIs)|
| docs/prd/prd-003/fase-4-green.md           | DEV / QA    | Relatório do TDD de Suporte em fase GREEN (Sucesso de Métricas)|
| src/__tests__/SupportDashboard.test.tsx    | QA          | Suíte de Testes Unitários de Métricas do Dashboard|
| docs/prd/prd-004/prd-inicial.md            | BA          | PRD de Blindagem de Acesso e Camada de Proteção de Dados |
| docs/prd/prd-005/prd-inicial.md            | BA          | PRD de Lixeira (Soft Delete) e Governança de Eventos Ativos |
| docs/prd/prd-006/prd-inicial.md            | BA          | PRD Póstumo de Unificação Visual e Zero-Alert Policy |
| tests/e2e/prd_006_visual_consistency.spec.ts| QA          | Testes E2E de Uniformidade Visual e Moderação Silenciosa |
| tests/e2e/prd_010_animacoes_gateways.spec.ts| QA         | Certificação E2E de Motor de Animações GSAP Gateways|

## Última Atualização
- Data    : 2026-05-11
- Por     : Maestro / DEV
- Motivo  : Criação da Versão v0.3.1. Entrega e homologação final das animações Cinematic Gateways (incluindo 1:1 wireframe e reversão controlada de Petalas 2). Tudo comitado e versionado.
