# Melhoria Contínua
> Arquivo incremental. Nunca apagar entradas.
> Lido automaticamente pelo MAESTRO antes de acionar o agente correspondente.

## Formato de Registro
## [YYYY-MM-DD] — Tipo: [BUG | PROCESSO | COMUNICAÇÃO | QUALIDADE | UX | NEGÓCIO | ARQUITETURA | OUTRO]
**Contexto:** [fase / PRD]
**Problema:** [descrição objetiva]
**Impacto:** [efeito causado]
**Ação corretiva:** [o que deve mudar]
**Status:** [ABERTO | APLICADO]

## Histórico

## [2024-05-24] — Tipo: PROCESSO
**Contexto:** Automação de Banco de Dados / DevOps
**Problema:** Erros "Tenant not found" e falta de binários (pg_dump) impedindo automação via agente.
**Impacto:** Necessidade de intervenção manual no painel do Supabase, quebrando o fluxo de entrega segura.
**Ação corretiva:** Padronização do uso da Porta 5432 (Session Mode) para DDL e exigência do Supabase CLI com Access Token.
**Status:** APLICADO

## [2026-05-09] — Tipo: PROCESSO
**Contexto:** Gestão de Ambientes e Supabase
**Problema:** Risco de inconsistências ou quebra de permissões ao alterar DDL/DML diretamente na base de dados de produção.
**Impacto:** Erros de permissão em tempo de execução para novos usuários cadastrados.
**Ação corretiva:** O DevOps deve assumir o protagonismo em qualquer alteração de infraestrutura, Supabase ou variáveis de ambiente, identificando e sinalizando os riscos de implementação de forma proativa antes de qualquer deploy.
**Status:** APLICADO

## [2026-05-09] — Tipo: PROCESSO
**Contexto:** DevOps e Controle de Versionamento (Git Pushes)
**Problema:** Realização de Git Pushes intermediários para o repositório remoto durante as fases de um PRD.
**Impacto:** Risco de quebrar compilações ou builds no Vercel de produção antes do PRD estar completamente finalizado e validado.
**Ação corretiva:** O DevOps deve apenas realizar Git Commits locais durante o desenvolvimento do PRD. O Git Push remoto só deve ser disparado após a conclusão e validação definitiva de todo o PRD.
**Status:** APLICADO
