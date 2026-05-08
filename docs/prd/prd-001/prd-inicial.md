# PRD 001 — Consolidação MVP e Estabilização

## 1. Visão Geral
Este documento consolida o estado atual do **InviteEventAI**, integrando as descobertas técnicas do relatório de arquitetura com novas necessidades de negócio para garantir uma plataforma segura, escalável e encantadora para noivos e convidados.

## 2. O Problema
Embora a plataforma possua um conjunto robusto de funcionalidades, a análise técnica identificou riscos críticos de privacidade (vazamento de dados via RLS) e inconsistências de banco de dados. Além disso, faltam ferramentas de produtividade para os noivos (como importação em massa) e recursos de engajamento para os convidados.

## 3. Objetivos de Negócio
- **Segurança e Privacidade**: Garantir que os dados dos convidados sejam acessíveis apenas por quem possui o convite específico.
- **Confiabilidade**: Eliminar bugs de interface (countdown) e erros de fuso horário.
- **Escalabilidade**: Preparar o backend para eventos com alto volume de convidados.
- **Encantamento**: Aumentar o engajamento através de recursos sociais (Mural de fotos).

## 4. Backlog Unificado e Priorização

### 4.1. CRÍTICO (Imediato - Segurança e Estabilidade)
| Item | Descrição | Categoria |
|------|-----------|-----------|
| **Refatoração RLS** | Bloquear `SELECT` público nas tabelas `convites`, `rsvp`, `convite_membros` e `presentes`. Exigir slug/token. | Segurança |
| **Validação de RSVP** | Garantir que um usuário/sessão só possa alterar o RSVP do seu próprio convite. | Segurança |
| **Consolidação de Migrações** | Unificar o esquema no `supabase/migrations/` e remover scripts obsoletos (`migrate.js`, `supabase-schema.sql`). | Débito Técnico |
| **Correção de Countdown** | Remover valor hardcoded no Dashboard e usar a data real do evento. | Bug UI |
| **Ajuste de Timezone** | Corrigir o offset de datas para garantir consistência global. | Bug Técnico |
| **Busca Segura** | Alterar a busca de convites para evitar enumeração por tentativa e erro. | Segurança |

### 4.2. IMPORTANTE (Próximas Sprints - UX e Gestão)
| Item | Descrição | Categoria |
|------|-----------|-----------|
| **Importação em Massa** | Upload de CSV/Excel para cadastro rápido de lista de convidados. | Feature Gestão |
| **Categorias de Presentes** | Permitir agrupar presentes (ex: "Cotas de Lua de Mel", "Casa Nova"). | Feature UX |
| **Otimização de Stats** | Mover cálculo de estatísticas do Dashboard para `VIEW` ou `RPC` no Postgres. | Performance |
| **Mural de Fotos** | Espaço para convidados fazerem upload de fotos e mensagens durante o evento. | Engajamento |
| **Lembretes RSVP** | Integração básica para envio de lembretes (ex: link para WhatsApp). | Feature Gestão |

### 4.3. NICE TO HAVE (Visão de Futuro)
| Item | Descrição | Categoria |
|------|-----------|-----------|
| **Livro de Recados Digital** | Mensagens de texto carinhosas dos convidados para os noivos. | Engajamento |
| **Gestor de Gastos** | Controle simples de orçamento do casamento dentro do admin. | Feature Gestão |
| **Suporte PWA** | Transformar o convite em um app instalável no celular. | UX Mobile |
| **Multilíngue** | Suporte a múltiplos idiomas para casamentos internacionais. | UX |

## 5. Requisitos Funcionais de Destaque (Novos)

### 5.1. Mural de Fotos (Engajamento)
- **Descrição**: Galeria colaborativa onde convidados podem subir fotos direto do celular.
- **Regra**: Fotos devem passar por aprovação (opcional) ou moderação simples.
- **Técnico**: Uso de Cloudinary para armazenamento e otimização.

### 5.2. Categorias de Cotas (Receita)
- **Descrição**: Em vez de apenas itens físicos, os noivos podem criar "Cotas" (ex: "Jantar em Paris - R$ 200").
- **Benefício**: Facilita a conversão de presentes em dinheiro via PIX/Stripe.

## 6. Riscos e Mitigações
- **Risco**: Quebra de compatibilidade ao alterar o RLS.
- **Mitigação**: Implementar testes de integração com Playwright cobrindo os cenários de acesso antes da mudança.

---
*Documento gerado por BA Senior em 2026-05-08.*
