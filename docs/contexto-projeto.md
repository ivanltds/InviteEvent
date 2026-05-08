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
| ID  | Nome          | Status     | Fase Atual |
|-----|---------------|------------|------------|
| 001 | Consolidação MVP e Estabilização | Em Progresso | Arquitetura |
| 002 | SaaS/Pagamento| Em Progresso| Validação  |

## Segurança
- **Última Auditoria:** 2024-05-23
- **Status:** Vulnerabilidades Críticas Encontradas (1 item)
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
| docs/arquitetura/plano-implementacao-fase-estabilizacao.md | Arquiteto | Plano de correções e segurança |
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

## Última Atualização
- Data    : 2024-05-24
- Por     : Architect Agent
- Motivo  : Finalização do Plano de Implementação da Fase de Arquitetura para PRD-001.
