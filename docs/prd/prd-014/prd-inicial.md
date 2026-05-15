# PRD-014: Group Gifting Modular (Cotas de Presentes)

> **Responsável:** @ba (Analista de Negócios)  
> **Status:** DESCOBERTA / EM DEFINIÇÃO  
> **Objetivo:** Aumentar a conversão de presentes de alto valor, permitindo o parcelamento colaborativo entre convidados (Cotas) e maximizar o take-rate da plataforma.

---

## 🎯 1. Visão do Produto e Oportunidade de Negócio

Itens de ticket médio-alto (acima de R$ 1.000,00) geram o fenômeno da **paralisia de escolha** em listas de presentes convencionais. Convidados individuais evitam comprá-los pelo alto custo, enquanto casais ficam constrangidos em adicioná-los por medo de parecerem gananciosos.

A introdução do **Group Gifting (Cotas de Presentes)** quebra essa barreira psicológica, transformando um item caro em múltiplas pequenas participações acessíveis.

### 📊 Hipóteses de Impacto (KPIs Esperados)
- **Aumento do Ticket Médio do Casamento:** +25% (maior aceitação de presentes luxuosos no catálogo).
- **Aumento na Taxa de Conversão de Presentes:** +32% em itens acima de R$ 500,00.
- **Aceleração da Captura de Receita:** Maior volume transacional via PIX Direto da plataforma (incidência de taxa administrativa por micro-transação).

---

## 👥 2. Personas e Casos de Uso

### A. O Convidado Pragmático (Carlos, 32 anos)
*   **Desejo:** Quer contribuir para a TV 4K dos noivos, mas dispõe apenas de R$ 300,00.
*   **Ação:** Seleciona o presente da TV na lista, escolhe comprar **1 cota de 10** disponíveis, paga e escreve seu recado personalizado de participação.

### B. O Casal Organizador (Amanda & Roberto)
*   **Desejo:** Querem incluir a Geladeira Side-by-Side (R$ 5.000) mas não querem que ela fique "sobrando" na lista para sempre.
*   **Ação:** Ativam a flag "Permitir Cotas" no item, estipulando 20 cotas de R$ 250. Acompanham o progresso percentual da arrecadação no seu dashboard.

---

## 🛠️ 3. Requisitos Funcionais (Escopo do Produto)

### RF-001: Parametrização de Cotas no Inventário
- O dashboard administrativo de presentes deve permitir que o usuário ative o fracionamento em qualquer item ativo.
- Variáveis de entrada:
  - `permite_cotas` (boolean)
  - `numero_cotas` (integer, mínimo 2)
  - O sistema calcula e exibe em tempo real o `valor_por_cota` baseado no `preco / numero_cotas`.

### RF-002: Vitrine Pública com Medidores de Progresso
- Presentes com cotas ativas devem exibir um **Badge de Grupo** na vitrine pública.
- Deve renderizar uma **Barra de Progresso Elegante** mostrando quantas cotas já foram compradas (ex: "7 de 10 cotas compradas").
- Se restarem cotas, o botão permanece ativo: "Comprar Cota(s)".

### RF-003: Multi-Seleção de Cotas no Checkout
- Ao clicar no presente de grupo, o convidado pode escolher quantas cotas deseja assumir de uma só vez (ex: assume 2 cotas de R$ 200 = R$ 400 total).
- O fluxo de Checkout PIX atual deve computar o valor acumulado e gerar a chave PIX estática correta.

### RF-004: Travamento Transacional ACID Fracionado
- Reaprovetar o motor de concorrência `presentes_locks` criado na PRD-12B.
- Em vez de travar o item inteiro como indisponível (`is_locked = true`), o lock deve reservar temporariamente (por 3 horas) as **unidades de cotas selecionadas**.
- Se a transação falhar, o daemon libera as cotas. Se for paga, as cotas são migradas para o status de "Vendidas".

### RF-005: Consolidação e "Match" de Finalização
- Quando a última cota for vendida, o status global do item no inventário muda automaticamente para "Totalmente Comprado" (Finalizado).

---

## ⚠️ 4. Restrições e Regras de Negócio

1. **Integridade Financeira (ACID):** Uma cota não pode ser vendida duas vezes se restava apenas uma vaga (Race Condition). O banco Postgres deve utilizar `SELECT FOR UPDATE` no balanço de cotas livres.
2. **Valor Mínimo por Cota:** Para não diluir o PIX em microvalores não rentáveis, o valor mínimo de cada cota gerada deve ser de **R$ 50,00**.
3. **Arredondamentos:** O sistema deve garantir que a soma das cotas seja exatamente igual ao valor nominal do produto. Qualquer resto de divisão de centavos será absorvido na primeira cota.
4. **Bloqueio de Compra Externa Dinâmico:** Presentes com cotas ativas podem exibir links para compras em lojas externas (afiliados) **APENAS se nenhuma cota tiver sido vendida ainda (0% arrecadado)**. No momento em que a primeira cota for vendida/reservada, o botão e link de redirecionamento externo devem ser **ocultados permanentemente**, forçando a finalização via cotas na plataforma para evitar inconsistência no inventário financeiro.

---

## 🎨 5. Wireframe UX/UI Desejado (Mental Map)

### Cartão da Vitrine (Público)
```text
[ FOTO DO PRODUTO ]
[ Geladeira Brastemp Side-by-Side ]
[ R$ 4.000,00 ]
--------------------------------------
|██████████████░░░░░░░|  (70% Arrecadado)
[ 7 de 10 cotas adquiridas ]
[ Botão: Presentear com Cotas ]
```

---

## 📋 6. Critérios de Aceite (MVP)

*   **CA-001:** O Organizador consegue dividir um item de R$ 1.000 em 10 cotas de R$ 100 via Dashboard Admin.
*   **CA-002:** A vitrine exibe corretamente o progresso (ex: 0/10 cotas).
*   **CA-003:** Um convidado reserva 2 cotas. Durante 3 horas, as cotas disponíveis caem para 8. Se não houver confirmação, voltam a ser 10.
*   **CA-004:** Ao comprar a 10ª cota, o item passa para "Comprado" e desativa o botão de reserva.

---
**Fase de Descoberta Pronta para Avaliação do Operador e Revisão de UX/UI.**  
@maestro: Por favor acione o designer UX para o próximo passo! 🎻🎹🎷🥂
