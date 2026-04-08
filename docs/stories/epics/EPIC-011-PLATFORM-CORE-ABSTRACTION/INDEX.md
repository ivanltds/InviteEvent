# EPIC-011: Abstração de Core para Plataforma (Event-as-a-Service)

## Status: 🟡 IN_PROGRESS

## Descrição
Este épico foca em "des-casamentizar" o motor do sistema, permitindo que o InviteEventAI suporte múltiplos eventos simultâneos e diferentes tipos de celebração (aniversários, chás, festas).

## Histórias (Stories)
- [x] **STORY-037:** Landing Page de Vendas e Abstração de Rotas. -> **DONE**
- [ ] **STORY-032:** Migração de Singleton para Multi-tenancy (Tabela `eventos`).
- [ ] **STORY-033:** Abstração de Entidades Principais via Metadados JSONB.
- [ ] **STORY-034:** Feature Flags por Evento (Ativação Modular de Recursos).

## Notas de Arquitetura
- Injeção de `evento_id` em todas as tabelas e políticas RLS.
- Uso de `JSONB` na coluna `metadata` da tabela `eventos` para configurações específicas de tipo de evento.
- Refatoração dos serviços (`giftService`, `inviteService`) para aceitar o contexto do evento.
