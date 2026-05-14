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
| 011 | Modo Telão Realtime              | CONCLUÍDO   | Concluído   |
| 12A | Smart Gift List - Fundação       | CONCLUÍDO   | Concluído   |
| 12B | Smart Gift List - Monetização    | CONCLUÍDO   | Concluído   |
| 12C | Smart Gift List - Autônomo       | CONCLUÍDO   | Concluído   |
| 12D | Smart Gift List - Cockpit        | CONCLUÍDO   | Concluído   |
| 013 | Higiene, Segurança & LGPD        | EM EXECUÇÃO | Planejamento / Execução |

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
| docs/estrategia-metricas-insights.md       | BA          | Framework Estratégico de Métricas e Visão Preditiva |
| docs/melhorias-suporte-v2.md               | BA          | Plano de Melhorias Estruturais de Atendimento V2 |
| docs/wireframes/modo-telao-tv.html         | UX/UI       | Wireframe do Modo Telão Realtime 16:9 |
| docs/wireframes/vitrine-importacao-rapida.html | UX/UI       | Wireframe Interativo: Vitrine 1-Clique (Fase A) |
| docs/wireframes/motor-monetizacao-reservas.html| UX/UI       | Wireframe Interativo: Monetização & Reservas (Fase B) |
| docs/wireframes/master-cura-automacao.html     | UX/UI       | Wireframe Interativo: Cérebro Autônomo (Fase C)      |
| docs/wireframes/master-gestao-presentes.html    | UX/UI       | Wireframe Interativo: Gestão Global de Presentes (Fase D) — V2.0.0 (Segurança Global e Casamentos Ativos) |
| docs/prd/prd-011/prd-inicial.md            | BA          | PRD Inicial do Modo Telão Realtime |
| docs/prd/prd-011/fluxo-ux.md               | UX/UI       | Mapeamento de fluxos e telas do Modo Telão|
| docs/arquitetura/plano-implementacao-prd-011.md | Arquiteto | Plano técnico para Modo Telão Realtime (TV)|
| tests/e2e/prd_011_modo_telao.spec.ts       | QA          | Conjunto de testes E2E de estabilidade da TV |
| docs/prd/prd-012-a/prd-inicial.md          | BA          | PRD-A Smart Gift List — A Fundação Inteligente |
| docs/prd/prd-012-a/arquitetura.md          | Arquiteto   | Desenho do banco de dados, DER e RLS (Fase A) |
| docs/prd/prd-012-a/plano-implementacao.md  | Arquiteto   | Plano de Sprints de banco, view dinâmica e frontend |
| docs/prd/prd-012-b/prd-inicial.md          | BA          | PRD-B Smart Gift List — Motor de Monetização |
| docs/prd/prd-012-c/prd-inicial.md          | BA          | PRD-C Smart Gift List — Cérebro Autônomo (Self-Healing) |
| docs/prd/prd-012-c/prd-refinado.md         | BA / Expert | PRD refinado detalhando Cura de Links e Matching Token|
| docs/prd/prd-012/relatorio-descoberta-final.md  | Maestro    | Relatório Histórico de Descoberta Expandida |
| tests/e2e/prd_012a_smart_gift.spec.ts       | QA          | Cobertura E2E de Abas, Vitrine SaaS e Categorização manual|
| docs/prd/prd-012-b/plano-implementacao.md  | Arquiteto   | Plano técnico de travas temporárias 3h e PIX Dinâmico|
| tests/e2e/prd_012b_trava_estoque.spec.ts   | QA          | Suíte E2E de Concorrência Atômica e Interstitial 4s |
| docs/prd/prd-012-c/plano-implementacao.md  | Arquiteto   | Plano técnico de Tabelas Operacionais, Daemon e Reconciliação |
| src/app/api/intelligence/autonomy/daemon/route.ts | DEV | API Trigger para acionar Daemon Stored Procedure de Auto-Cura |
| src/app/api/intelligence/reconcile/route.ts | DEV      | API Endpoint para ingestão de relatórios CSV de vendas |
| src/__tests__/lomadeeDaemon.test.ts    | QA          | Suíte de Testes Unitários do Daemon de Auto-Cura Direta (Amazon/Magalu) |
| docs/arquitetura/gift-agent-lomadee.md    | Arquiteto   | Especificação Oficial do Agente OpenAI com Normalização Linear SAF (MCDA) |
| docs/prd/prd-012-d/prd-inicial.md         | BA / Maestro| PRD-D Smart Gift List — Cockpit de Gestão & Cura |
| docs/arquitetura/plano-implementacao-prd-012-d.md | Arquiteto | Plano de Implementação Técnica para o Cockpit Global (Bloco D)|
| src/app/api/admin/catalogo/route.ts        | DEV         | Handler de Inventário Global com Filtros, KPIs e Safe-Delete |
| src/app/api/admin/catalogo/bulk-curate/route.ts | DEV    | Handler de Enfileiramento em Massa na Fila de Auto-Cura |
| src/app/(admin)/admin/catalogo/CatalogoGlobal.module.css | UX/UI | Módulo de CSS com tema Dark Premium e Efeitos de Vidro Transparente |
| src/app/(admin)/admin/catalogo/page.tsx    | DEV         | Componente Dashboard Administrativo completo do Cockpit Global |
| src/app/api/admin/catalogo/approve/route.ts| DEV         | Handler de Aprovação e Promoção de Candidatos locais para Catálogo Global |
| docs/prd/prd-012/relatorio-conclusao-entrega.md | Maestro/DEV | Relatório Consolidado de Entrega da Suíte PRD-12 (Fundação, Monetização, Automação e Cockpit) |

## Última Atualização
- Data    : 2026-05-14
- Por     : Maestro / DEV
- Motivo  : CONCLUSÃO E ENTREGA DO PRD-12 + RELEASE V0.3.4. Finalizada a suíte corporativa de presentes inteligentes. Restaurada paridade visual estrita dos cards de candidatos ao catálogo seguindo as regras globais do design system. Criada documentação consolidada do PRD-12. Corrigidos mocks globais do Jest, garantindo blindagem de testes unitários. Verificado build Next.js de produção com absoluto sucesso (zero erros de compilação). Bump de versão do projeto para v0.3.4 executado com sucesso. Total estabilidade operacional homologada! Pronto para implantação em Produção!

