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
| 013 | Higiene, Segurança & LGPD        | CONCLUÍDO   | Concluído   |
| 014 | Group Gifting (Cotas)            | CONCLUÍDO   | Concluído   |
| 015 | Estabilização & Conversão (FOMO) | CONCLUÍDO   | Concluído   |
| 018 | Blindagem de QA & Stress         | ATIVO       | DEV         |
| 016 | Motor Viral & Kits de Mídia      | BACKLOG     | Descoberta  |
| 017 | Termômetro de Convidados         | BACKLOG     | Descoberta  |


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
| docs/arquitetura/roadmap-estrategico-crescimento.md | Maestro | Planejamento tático das prioridades de aquisição e conversão |
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
| docs/prd/prd-013/termos-de-uso.md          | BA / Legal  | Redação oficial dos Termos de Uso e Responsabilidade SaaS |
| docs/prd/prd-013/politica-privacidade.md   | BA / Legal  | Redação oficial da Política de Privacidade e Direitos LGPD |
| docs/prd/prd-013/fluxo-ux.md               | UX/UI       | Mapeamento detalhado das jornadas de consentimento e overlays |
| docs/wireframes/privacidade-e-termos.html  | UX/UI       | Protótipo Interativo com Checkbox Condicional e Modal Legal |
| docs/prd/prd-013/plano-implementacao.md  | Arquiteto   | Desenho de Banco, Gatilho Server-IP, Cookies e Validadores |
| docs/prd/prd-013/relatorio-analise-estatica.md | Arquiteto | Auditoria inicial de qualidade do código e débitos técnicos |
| docs/prd/prd-013/relatorio-vulnerabilidades-seguranca.md | Arquiteto | Auditoria e mitigação de RLS e vulnerabilidades no Supabase |
| supabase/migrations/20260515000000_prd013_lgpd_governance.sql | DEV | Migração de banco com triggers invioláveis de IP e colunas LGPD |
| src/components/sections/__tests__/RSVP_LGPD.test.tsx | QA | Suíte de testes unitários TDD (GREEN) que garantem o fluxo e restrições |
| src/components/ui/CookieBanner.tsx         | DEV / UX   | Widget flutuante com delay inteligente e modais integrados |
| src/components/ui/LegalFooter.tsx          | DEV / UX   | Rodapé legal responsivo e customizável (Clear e Dark Glass) |
| docs/prd/prd-014/prd-inicial.md            | BA          | PRD Inicial de Group Gifting (Cotas de Presentes) e Regras ACID |
| docs/prd/prd-014/fluxo-ux.md               | UX/UI       | Mapeamento visual das barras de progresso e contadores dinâmicos |
| docs/wireframes/cotas-presentes.html       | UX/UI       | Protótipo Interativo de multi-seleção e barras douradas premium |
| docs/wireframes/admin-cadastro-cotas.html  | UX/UI       | Protótipo Interativo da gestão de cotas com toggle e validações |
| docs/prd/prd-014/plano-implementacao.md    | Arquiteto   | Desenho de banco, RPC de Lock Fracionado ACID e Services |
| supabase/migrations/20260515133000_prd014_cotas_presentes.sql | DEV | Migração SQL que altera o esquema, cria triggers de cotas e RPC ACID de progresso |
| docs/prd/prd-014/relatorio-qa-fase-1.md    | QA          | Relatório final de garantia de qualidade e verificação de critérios com veredito APROVADO |
| docs/prd/prd-015/fluxo-ux.md               | UX/UI       | Mapeamento detalhado das micro-animações de radar e badges |
| docs/wireframes/booster-conversao-fomo.html| UX/UI       | Protótipo Interativo com Smart Sorting e Price Suggester |
| docs/prd/prd-015/plano-implementacao.md    | Arquiteto   | Desenho da API de telemetria cacheada e algoritmos front |
| supabase/migrations/20260516000000_stabilization_and_auto_curation.sql | DEV | Correção de RLS Recursivo, Persistência de Varejo e Índices |
| tests/e2e/prd_015_stabilization_ux.spec.ts| QA          | Testes E2E de UX (Paginação 10 em 10) e Estabilização Admin |
| src/lib/types/database.ts                  | DEV         | Atualizado com campo parceiro_nome para persistência de cura |
| docs/prd/prd-018/prd-inicial.md            | BA          | PRD Inicial de Blindagem de QA & Stress (Hardening) |
| docs/prd/prd-018/fluxo-ux.md               | UX/UI       | Mapeamento de fluxos e estados de erro Context-Aware |
| docs/wireframes/resiliencia-feedbacks.html  | UX/UI       | Protótipo Interativo com alternância de Temas (Luxo/Admin) |
| docs/arquitetura/plano-implementacao-prd-018.md | Arquiteto | Plano técnico de RPCs Atômicas, ErrorBoundaries e Stress |
| src/lib/services/test-utils/mockFactory.ts | QA | Mock Factory inteligente V9.0 para Supabase (Unified Queue) |
| src/lib/services/__tests__/telemetry.test.ts | QA | Suíte de testes de telemetria, rage-clicks e JSDOM resilience |
| src/lib/services/__tests__/ultimate_coverage_v2.test.ts | QA | Suíte definitiva de cobertura enterprise (Surgical Error Injection) |


## Última Atualização
- Data    : 2026-05-15
- Por     : Maestro / DEV / QA
- Motivo  : PRD-013 CONCLUÍDO, TESTADO EM TDD GREEN E PUBLICADO (v0.3.6). Todas as funcionalidades de governança e conformidade LGPD foram implementadas com absoluto rigor técnico. O banco de dados recebeu segurança por triggers auditáveis invioláveis, os componentes foram codificados sob testes TDD que validam o bloqueio condicional de dados de saúde. Foi criado o controle inteligente de cookies com suporte a atrasos de animação diferenciados (Landing x Convite). Todos os testes passaram e o sistema foi validado por análise estática limpa!

- Data    : 2026-05-15 (Tarde)
- Por     : Maestro / BA
- Motivo  : INICIADA DESCOBERTA PRD-014 (Cotas de Presentes / Group Gifting). Criada a especificação inicial detalhando a hipótese de aumento de 32% na conversão de presentes caros. Mapeadas regras financeiras ACID de integridade de cotas com lock transacional temporário (3 horas). Pronto para a fase de Experiência/UX!

- Data    : 2026-05-15 (Noite)
- Por     : Maestro / UX-UI / Arquiteto
- Motivo  : FASES DE EXPERIÊNCIA E ARQUITETURA PRD-014 CONCLUÍDAS EM CONJUNTO. Criado o mapeamento de fluxos UX e o protótipo interativo com barras de progresso douradas premium. Desenvolvido o plano de implementação técnica com Stored Procedure SQL (RPC) para bloqueio transacional atômico via `SELECT FOR UPDATE` na reserva fracionada, mitigando race conditions. Mapeadas as extensões de tabelas de lock de 3h. Tudo pronto para a validação do Operador e início da Codificação TDD!

- Data    : 2026-05-15 (Fim da Noite)
- Por     : Maestro / DEV / QA
- Motivo  : DESENVOLVIMENTO E VALIDAÇÃO QA PRD-014 CONCLUÍDOS. Implementamos os controles interativos de cota (Switch) em tempo real no Admin (Lista e Cards), redesenhamos a estética dos Cards do organizador com padrão SaaS premium e barra de progresso financeiro integrada, e flexibilizamos a compra integral/afiliados se nenhuma cota for vendida ainda. Executada a higienização TypeScript nas páginas. A história foi submetida à validação estrutural da esteira de testes e está com status oficial APROVADO pelo Agente de QA. Pronto para DEPLOY!

- Data    : 2026-05-15 (Madrugada)
- Por     : Maestro / DevOps
- Motivo  : DEPLOY E MERGE FINAL DO PRD-014 CONCLUÍDOS. Consolidado o merge da branch feat/prd-014-cotas-presentes para a main. Executado o ciclo de integração contínua local (Next.js build otimizada) com 100% de êxito. Aplicado o bump de versão de v0.3.6 para v0.3.7 no package.json. Story de Cotas de Presentes implantada oficialmente em produção! 🚀🌌

- Data    : 2026-05-15 (Nova Manhã)
- Por     : Maestro / BA / Value-Analyst

- Data    : 2026-05-16
- Por     : Maestro / DEV / QA
- Motivo  : ESTABILIZAÇÃO CRÍTICA E GO-LIVE PRD-015 CONCLUÍDOS. Resolvido erro de estouro de pilha (stack depth) via ajuste de NO FORCE RLS na tabela perfis. Implementada persistência do nome da loja na autocura. Refinado design system (Champagne/Gold) em modais de contingência e assistentes. Implementada paginação progressiva 10 em 10 com animações Framer Motion. Criada migração consolidada e nova suíte de testes E2E para garantir estabilidade de produção. App v0.3.8 pronto para escala!

- Data    : 2026-05-16 (Correção de Build)
- Por     : Maestro / DEV
- Motivo  : ESTABILIZAÇÃO v0.3.9 CONCLUÍDA. Resolvidos erros críticos de sintaxe JSX em `presentes/page.tsx` e `catalogo/page.tsx` que impediam o build de produção. Consolidada a infraestrutura de rastreabilidade com a coluna `parceiro_nome` e RPC `apply_healed_link`. Build de produção validado com sucesso (Exit 0). Sistema estabilizado para o Go-Live final.

- Data    : 2026-05-16 (Fix Exclusão)
- Por     : Maestro / DEV / QA
- Motivo  : CORREÇÃO DEFINITIVA DA EXCLUSÃO NO COCKPIT GLOBAL (Story-014). Resolvido o erro 403/Forbidden em produção através da injeção manual de tokens JWT nas chamadas de API administrativa e refatoração do helper `getSupabaseServerClient` para suportar cabeçalhos de autorização. Corrigida a lógica de deleção física/lógica no backend para garantir integridade financeira. Adicionada camada de validação `typecheck` ao pipeline. v0.3.10 estável e resiliente!

- Data    : 2026-05-16 (Noite)
- Por     : Maestro / BA
- Motivo  : INICIADA FASE 1.5 - PRD-018 (Blindagem de QA & Stress). Seguindo recomendação do Analista de Valor, iniciamos a fase de Descoberta para garantir a resiliência do sistema antes da expansão viral. Criado o PRD Inicial focando em Stress Testing, Race Conditions e Auditoria de UX Mobile.

- Data    : 2026-05-16 (Late Night)
- Por     : Maestro / QA / DEV
- Motivo  : HARDENING DE COBERTURA ENTERPRISE (PRD-018). Alcançada estabilidade de produção com 236 testes passando (100% sucesso). Implementada a suite `ultimate_coverage_v2` que elevou a cobertura da camada de serviços para ~87% global (Lines), com 100% em RSVP e Gallery. Estabilizada a infraestrutura de mocks (MockFactory V9.0) e resolvidos conflitos de JSDOM em navegação e telemetria. v0.3.11 pronto para escala com segurança técnica certificada!

