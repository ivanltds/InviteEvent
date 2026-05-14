# 📋 Revisão de Comportamento e Cenários: PRD-012 Consolidado
> **Fase:** DESCOBERTA (@ba) / **Protocolo de Alinhamento Crítico**  
> **Status:** AGUARDANDO VALIDAÇÃO DO OPERADOR  
> **Objetivo:** Mapear rigorosamente o comportamento esperado, cenários de exceção e regras de negócio para readequar a implementação existente e calibrar os futuros testes E2E.

---

## 🔍 Introdução & Ajuste de Rota
Conforme determinação do Operador via `@maestro`, suspendemos qualquer nova implementação de código para focar 100% na validação conceitual de comportamentos. O código já desenvolvido servirá apenas como base de referência técnica, mas as **Regras de Negócio e Fluxos** definidas a seguir serão as soberanas.

Abaixo estão os 3 blocos essenciais da entrega mapeados em **Cenários Atuais vs Questões de Alinhamento**.

---

## 🛡️ BLOCO 1: Trava de Estoque e Gestão de Reserva (3 horas)
> **STATUS:** ✅ **VALIDADO PELO OPERADOR**
O comportamento atual de locks de concorrência por 3 horas está validado e homologado. Nenhuma alteração de negócio é necessária nesta camada.

---

## 🧠 BLOCO 2: Motor de Cura Inteligente (Self-Healing)
> **STATUS:** 🚨 **REDEFINIÇÃO CRÍTICA DE ESCOPO**

### 📝 Regra de Ouro da Auto-Cura
O cérebro autônomo **não deve apenas corrigir o link**, nem apontar para páginas de busca genéricas. O Daemon deve **substituir integralmente a entidade do presente quebrado** por um produto real equivalente encontrado em um parceiro de afiliação.

A cura deve atualizar na nossa base:
1.  **Título** (Nome oficial do produto encontrado no parceiro).
2.  **Preço** (Preço real da melhor oferta ativa).
3.  **Foto / Imagem** (Thumbnail ou imagem do produto retornada pela API).
4.  **Descrição** (Texto descritivo oficial do varejista).
5.  **Link Afiliado** (Link de tracking pronto).

### 🔌 Abstração Multi-Afiliados
O fluxo deve ser desenhado prevendo o crescimento. A interface de busca de catálogo deve ser genérica:
*   **Fase Atual:** Integrado estritamente à API Lomadee (SocialSoul).
*   **Fase Futura (Outro PRD):** Inserção de adaptadores para Amazon Afiliados, Mercado Livre Afiliados, Awin, etc., sem quebrar a lógica do Daemon.

### 📊 Cálculo de Preferência: Fórmula de Afinidade Financeira (SAF)
Para decidir qual produto de uma lista de ofertas similares deve assumir o lugar do presente quebrado, propomos a seguinte ordenação automatizada:

$$\text{SAF (Score de Afinidade Financeira)} = \text{Comissão Absoluta (R\$)} \times \left( \frac{\text{Preço Original}}{\text{Preço Novo}} \right)^2$$

#### ⚖️ Por que essa fórmula funciona?
1.  **Favorece Preços Baixos (Convidado):** Se o produto novo for mais barato que o original, o fator multiplicador cresce exponencialmente ($> 1$), empurrando o item para o topo.
2.  **Pena Preços Altos (Convidado):** Se o produto novo for muito mais caro, o fator cai drasticamente ($< 1$), jogando o item para o fim da lista mesmo que a comissão absoluta seja alta.
3.  **Favorece Rentabilidade (Nós):** Multiplica diretamente pela comissão em Reais. Se duas ofertas têm preços idênticos, a que paga maior porcentagem vence.

**Critério de Desempate:** O item com o maior **SAF** será retornado em primeiro lugar (Top 1) e assumirá as informações na base de dados.

---

## 💰 BLOCO 3: Motor de Monetização e Reconciliação
> **STATUS:** ❄️ **CONGELADO**
Por orientação estratégica do Operador, o módulo de reconciliação de vendas offline e upload de relatórios CSV está **temporariamente fora do escopo (FROZEN)**. O sistema continuará gerando e injetando os tokens `source=AEG-xxx` no clique para fins de legado e auditoria futura no banco.


---

## 📐 Próximos Passos Propostos pelo @maestro:
1.  **Validação deste PRD Comportamental:** O operador revisa e responde às questões críticas acima.
2.  **Ajustes do PRD:** O `@ba` consolida as respostas em especificações finais.
3.  **Fase EXPERIÊNCIA (@ux-ui):** O designer revisa as telas (cards, botões de cancelamento de trava, cockpit) garantindo consistência visual.
4.  **Fase ARQUITETURA & DEV:** O arquiteto ajusta os testes e2e conforme o novo comportamento para garantir que a implementação existente passe com sucesso ou receba os ajustes mínimos necessários.

---
**Aguardando suas orientações para seguir com a consolidação do fluxo de negócios.** 🫡
