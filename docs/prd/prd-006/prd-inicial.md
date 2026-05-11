# PRD-006 — Unificação de Design System, Grid Premium e Higienização Visual 💎
> Versão: 1.0 | Data: 2026-05-11 | Status: CONCLUÍDO (Póstumo)

## 1. Visão Geral do Produto
Este ciclo focou na convergência estética radical da plataforma administrativa e portais públicos. Asseguramos que 100% das interfaces obedeçam à gramática visual premium (Gold Accent), eliminaram-se atritos de UX invasivos (NATIVE ALERTS) e padronizaram-se todas as matrizes pictográficas (ZERO EMOJI MANDATE), resultando em um sistema coeso, limpo e profissional.

## 2. Alterações Implementadas (Executadas)

### 2.1. Revitalização Crítica de Agenda & Cronograma
- **Problema**: A tela de agenda utilizava controles HTML brutos, grids assimétricos e alert prompts de confirmação legados.
- **Solução**:
  - **Grid Card Premium**: Introduzido layout de grid lateralizado com vetores flutuantes e tradução 3D no hover.
  - **Footer Reservado**: Prevenção de sobreposição movendo ações administrativas flutuantes para um flexbox footer estático compartilhado com links de geo-localização.
  - **Expansão de Biblioteca Vetorial**: Substituídos vetores errôneos (ex: X de festa) por ícones comemorativos e expansão para Drink, Música, Fotos.
  - **Modal Interno**: `window.confirm` removido; inserção de controle assíncrono Framer-Motion para exclusão.

### 2.2. Convergência Estética de Mural (Fotos & Texto)
- **Problema**: O mural de recados possuía layout desalinhado do mural de fotos, com botões assimétricos (vermelho/cinza) e bordas verdes conflitantes.
- **Solução**:
  - **Border Gold State**: A cor de borda superior para itens aprovados migrou do verde esmeralda bruto para o Gold Tone oficial (`#D4AF37`), unificando o status com o design principal.
  - **Ações Unificadas no Rodapé**: Botões "Ocultar" e "Excluir" agora operam em paridade visual neutra, sem disparidade cromática.
  - **Badges Cinza**: O selo `APROVADO` foi padronizado como referência de sobriedade em stone-grays (`#f1f5f9`).

### 2.3. Padronização de Listas (Convidados & Presentes)
- **Problema**: Ações repetitivas nas linhas (Copy, WhatsApp, Edit, Delete) apresentavam variações cromáticas excessivas (arco-íris de botões).
- **Solução**:
  - **Vector Unification**: Todos os botões de ação operam agora sob a mesma base neutra que escala suavemente para Gold no Hover, garantindo um visual limpo.
  - **Migração de RSVP**: Status "Confirmado" transicionou de verde vibrante para o Badge Cinza, alinhando-se à linguagem do mural aprovada pelo usuário.

### 2.4. Mandato Global de Higienização Visual
- **Problema**: Presença de pictogramas Unicode (emojis) e bloqueios síncronos (`alert()`) degradando o profissionalismo da aplicação.
- **Solução**:
  - **Zero Emojis**: Varredura e substituição total por SVGs lineares (1.5px a 2.0px) em fluxos públicos (Gallery, Envelope, Checkout) e internos (Dashboard, Onboarding).
  - **Zero Alertas**: Migração de alertas de erro de pagamento e validações silenciosas para console logging e toasters inline não-bloqueantes.

---

## 3. Plano de Testes (QA Execution Strategy)

Abaixo está a matriz de cobertura exigida para certificar a conformidade visual e funcional.

### 🧪 Matriz E2E (Playwright)
1. **TEST-006-01: Validação de Moderação Silenciosa**
   - *Passos*: Acessar painel de mural -> Tentar excluir recado.
   - *Esperado*: O modal interno do React abre; NENHUM `window.confirm` é interceptado na página.
2. **TEST-006-02: Renderização de Ícones Dinâmicos na Agenda**
   - *Passos*: Criar marco de agenda selecionando "Festa" ou "Drink" -> Observar grid.
   - *Esperado*: O card renderiza o SVG específico na coluna lateral, sem sobrepor títulos ou linkings.
3. **TEST-006-03: Unificação de Ações em Grid**
   - *Passos*: Validar botões em Convidados e Presentes.
   - *Esperado*: Estilos de cor computados devem ser idênticos (neutral scaling for gold highlight) em ambos os componentes.

---
*Nota de Homologação: Documento validado pelo Maestro AI e arquivado.*
