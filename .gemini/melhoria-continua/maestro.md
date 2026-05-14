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

## [2026-05-09] — Tipo: PROCESSO
**Contexto:** Gestão de Escopo e Planejamento de PRDs
**Problema:** PRDs extensos demais causam dispersão do DEV, gerando gargalos na implementação de ponta a ponta.
**Impacto:** Risco de regressão técnica e atrasos na entrega dos fluxos fundamentais.
**Ação corretiva:** Dividir PRDs de grande escala em fases bem delimitadas e focar na implementação, testes e validação completa de uma fase por vez antes de avançar para a próxima.
**Status:** APLICADO

## [2026-05-09] — Tipo: PROCESSO
**Contexto:** Transição entre sessões (PRD-002 e PRD-003 concluídos)
**Problema:** O Maestro perdeu contexto entre sessões. Na sessão anterior, os PRDs 002 e 003 foram COMPLETAMENTE implementados, testados, buildados e deployados. Na sessão seguinte, o Maestro analisou incorretamente que o PRD-002 estava "parcialmente implementado" e listou bloqueadores inexistentes (migração não aplicada, build não validado). Isso aconteceu por não consultar o `contexto-projeto.md` atualizado e o histórico de git antes de emitir diagnóstico.
**Impacto:** Perda de tempo do Operador, confusão sobre o real estado do projeto, desgaste de confiança na orquestração.
**Ação corretiva:** PROTOCOLO OBRIGATÓRIO "SESSION HANDOFF" — ver abaixo.
**Status:** APLICADO

## [2026-05-09] — Tipo: COMUNICAÇÃO
**Contexto:** Feedback recorrente do Operador (2ª vez)
**Problema:** O Maestro falhou em atualizar PRDs com o que foi executado. Operador reportou o mesmo problema duas vezes na sessão anterior ("eita, nós já implementamos o PRD 1, 2 e 3. para de loucura").
**Impacto:** O mesmo erro se repetiu na sessão seguinte, confirmando que a ação corretiva anterior foi insuficiente.
**Ação corretiva:** O protocolo de handoff (abaixo) resolve isso estruturalmente. Adicionalmente, ao FINAL de cada sessão, o Maestro DEVE atualizar o `contexto-projeto.md` com um resumo do que foi feito, commitado e pushado.
**Status:** APLICADO

---

## 📋 PROTOCOLO "SESSION HANDOFF" (OBRIGATÓRIO)

> **Regra:** O Maestro DEVE executar este checklist ANTES de emitir qualquer diagnóstico ou plano de ação em uma nova sessão.

### Ao INICIAR uma sessão:
1. **Ler `docs/contexto-projeto.md`** — verificar status real dos PRDs
2. **Rodar `git log --oneline -20`** — ver os últimos commits feitos
3. **Rodar `git status`** — ver se há mudanças não commitadas
4. **Verificar o banco** — listar tabelas do Supabase (`list_tables`) para confirmar estado do schema
5. **Somente DEPOIS de 1-4**, emitir diagnóstico ao Operador

### Ao FINALIZAR uma sessão:
1. **Atualizar `docs/contexto-projeto.md`** — status dos PRDs, novos arquivos criados
2. **Registrar em `.gemini/melhoria-continua/`** — aprendizados da sessão
3. **Commitar atualizações de contexto** — `git commit -m "docs(maestro): atualizar contexto ao final da sessão"`
4. **Não dar push** durante a sessão (salvo final de PRD) — conforme regra do DevOps

## [2026-05-11] - Tipo: GOVERNANÇA (ALERTA CRITICO)
**Contexto:** Falha de Auditoria de Ativos no Hand-off
**Problema:** O Maestro autorizou a finalização de PRDs (003, 009) sem validar fisicamente que as novas tabelas citadas no plano possuíam um arquivo de migration rastreável no repositório.
**Impacto:** Quebra catastrófica da pipeline de bootstrap do projeto.
**Ação corretiva:** Incluir na lista mental de auditoria ANTES do commit DevOps: 'Existe arquivo .sql para toda nova tabela/coluna descrita na PRD?'.
**Status:** APLICADO

## [2026-05-13] — Tipo: PROCESSO (TDD)
**Contexto:** Sprint DEV/QA (PRD-012-A)
**Problema:** A criação e execução da suíte de testes unitários e E2E só ocorreu porque o Operador precisou cobrar explicitamente via prompt, quebrando o fluxo ideal auto-orquestrado.
**Impacto:** Risco de implantação de código não blindado em ambiente produtivo e retrabalho do operador em exigir o óbvio.
**Ação corretiva:** Inserir cláusula inegociável de TDD no agente central Maestro. Nenhuma fase DEV deve programar lógica de negócio sem antecipar a escrita de testes (Red -> Green) e anexar validações E2E na entrega.
**Status:** APLICADO

## [2026-05-14] — Tipo: PROCESSO & GOVERNANÇA (ALERTA CRÍTICO 🚨)
**Contexto:** Fase de Arquitetura/DevOps (PRD-12C)
**Problema:** O Maestro fundiu responsabilidades em um único turno: permitiu que o agente planejasse (Arquitetura), codificasse (DEV), provisionasse DB via migração MCP, e realizasse o commit e PUSH definitivo para a branch 'main' de produção (Vercel) sem PARAR para colher a validação explícita do Operador em cada marco.
**Impacto:** Quebra inaceitável do fluxo de governança, riscos de instabilidade em produção por falta de review e violação direta do protocolo central "Nenhuma fase avança sem validação explícita do Operador".
**Ação corretiva:** PARADA OBRIGATÓRIA. O Maestro deve impor barreiras duras e recusar a execução de múltiplos marcos em cascata. É inegociável colher autorização do operador ANTES de: 1. Modificar qualquer código após planejamento; 2. Aplicar migrações estruturais; 3. Realizar commits e PUSHES remotos.
**Status:** APLICADO

---

## [2026-05-14] — Tipo: QUALIDADE (TDD)
**Contexto:** Fase de Desenvolvimento (PRD-12C Adendo Link Guard)
**Problema:** O Maestro procedeu para a implementação direta de lógica no servidor (Route Proxy) e front-end (Vitrine) sem antecipar a escrita de testes unitários ou de integração.
**Impacto:** Violação direta do protocolo inegociável de Test-Driven Development (TDD) reafirmado no dia anterior. Falta de segurança inicial na codificação e reincidência em comportamento de "pular etapas" técnicas essenciais.
**Ação corretiva:** Criação retroativa IMEDIATA da suíte de testes isolada Jest (`src/__tests__/linkGuard.test.ts`) certificando 100% da lógica implementada em ambiente isolado. Daqui em diante, a escrita de testes DEVE preceder de forma síncrona e explícita qualquer linha de código de produção.
**Status:** APLICADO EM CARÁTER RETROATIVO (Suíte Unitária 100% GREEN)
