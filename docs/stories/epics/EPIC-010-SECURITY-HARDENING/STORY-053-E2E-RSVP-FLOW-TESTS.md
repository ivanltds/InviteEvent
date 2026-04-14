# STORY-053: Testes E2E do Fluxo Core de RSVP

## Descrição
Como membro do time de qualidade, desejo ter cobertura de testes ponta-a-ponta do fluxo principal do produto, para garantir que nenhum deploy futuro quebre a experiência do convidado sem detecção imediata.

## Contexto (Retro — Item 5)
> @qa (Quinn): "Temos unit tests e component tests, mas nenhum teste que valide o fluxo ponta-a-ponta: receber link → abrir convite → preencher RSVP → admin vê confirmação. Esse é o *core loop* do produto e deveria ter cobertura."

## Critérios de Aceitação

### Cenário 1: Fluxo completo do convidado
- **DADO** um convite com slug válido e evento ativo
- **QUANDO** o convidado acessa `/inv/[slug]`
- **ENTÃO** deve ver o convite carregado com nome, data e seções habilitadas

### Cenário 2: Formulário de RSVP
- **DADO** o convidado na página do convite
- **QUANDO** preenche nome, quantidade e confirma presença
- **ENTÃO** deve ver mensagem de sucesso e o RSVP deve ser gravado no banco

### Cenário 3: Visibilidade no Admin
- **DADO** um RSVP confirmado
- **QUANDO** o admin acessa `/admin/convidados`
- **ENTÃO** deve ver o status do convite atualizado para "Aceito"

### Cenário 4: Barreira de ativação
- **DADO** um evento com `is_active = false`
- **QUANDO** um convidado acessa `/inv/[slug]`
- **ENTÃO** deve ser redirecionado para `/manutencao`

### Cenário 5: Convite sem slug válido
- **DADO** um slug que não existe no banco
- **QUANDO** o convidado acessa `/inv/slug-invalido`
- **ENTÃO** deve ver estado "Convite não encontrado" sem expor dados do sistema

## Ferramentas Sugeridas
- **Playwright** ou **Cypress** para E2E browser automation
- Ou extender o **Jest + React Testing Library** para integration tests que mockam Supabase

## Prioridade: 🟡 Média
## Esforço: M (3-5h)
## Status: 📋 TODO
## Epic: EPIC-010 (Security & Quality Hardening)

## Dependências
- ⚠️ STORY-055 (Proxy + Build fix) — deve estar resolvida para testes não falharem por rota exposta
- ⚠️ STORY-051 (CI/CD) — os E2E devem rodar no pipeline

## Notas Técnicas
- Os testes devem usar um evento de teste fixo no Supabase (ambiente de staging ou seed de test)
- Mocks do Supabase client para unit/integration, ambiente real para E2E
- Adicionar ao GitHub Actions workflow após STORY-051
