# Visão de UX & Estratégia de Dados — PRD-008 👁️🎨
> Responsável: @ux-ui | Maestro Orchestration | Data: 2026-05-11

## 1. A Perspectiva do Convidado (Micro-Momentos de Verdade)
Para o convidado, a coleta deve ser **100% invisível** para não gerar ansiedade de rastreamento. O valor para a UX aqui é descobrir onde o usuário "tropeça" silenciosamente.

### Comportamentos de Alto Valor para Capturar AGORA:
1.  **Cliques de Frustração (Rage Clicks)**: Registrar se o convidado clica repetidamente (>3x em 2s) em um botão sem reação. 
    *   *Por que?* Indica bugs silenciosos ou botões de PIX/Compra que parecem quebrados.
2.  **Tempo de Hesitação no PIX**: Rastrear quanto tempo a tela com a chave PIX/QR Code fica aberta ANTES do convidado fazer o upload.
    *   *Por que?* Se esse tempo for > 5 minutos e depois houver abandono, o processo de copiar-colar está gerando atrito mental.
3.  **Tentativa de Compartilhamento**: Cliques em "Copiar Link" ou botões de compartilhamento.
    *   *Por que?* Mede o viral coeffcient (quantos convidados repassam o link para outros da família).
4.  **Ponto de Evasão do Scroll (Scroll Depth)**: Até qual seção o convidado desce antes de fechar o site?
    *   *Por que?* Se 80% dos usuários param de rolar ANTES de chegar na Lista de Presentes, a ordem das seções está sabotando a receita.

---

## 2. A Perspectiva do Usuário MASTER (Actionable Business Insights)
O Administrador Master não quer ver logs técnicos. Ele quer respostas para tomar decisões que trazem dinheiro.

### Os 4 Pilares de Insight que o Master Precisa:

#### 📊 A. Termômetro de Desejo (Preço vs Interesse)
*   **A Métrica**: Mapear itens da lista de presentes com ALTÍSSIMO número de cliques, mas ZERO compras.
*   **A Decisão**: Isso indica que o valor está alto demais. O sistema Master pode sugerir: *"Ei, esse item está atraindo muito olhar mas ninguém comprou. Que tal dividi-lo em cotas menores?"*.

#### 💸 B. O Custo do Desvio (External Leakage Cost)
*   **A Métrica**: Soma estimada do valor dos presentes onde houve clique em "Comprar na Loja Sugerida" em vez da Cota Virtual.
*   **A Decisão**: Dá ao Master o número real: *"Você perdeu R$ 5.000,00 em receita este mês por oferecer o link externo"*. Isso valida a decisão de remover essa opção ou cobrar uma taxa de conveniência.

#### 🎯 C. O Gargalo do RSVP
*   **A Métrica**: Quantidade de pessoas que clicaram em "Confirmar Presença", preencheram o nome, mas fecharam a aba antes de enviar o formulário final.
*   **A Decisão**: Simplificar o formulário ou criar um lembrete dinâmico.

#### 📱 D. Health Score do Processador de Pagamentos
*   **A Métrica**: Taxa de sucesso na primeira tentativa de Upload do Comprovante.
*   **A Decisão**: Se 50% dos usuários precisam tentar subir a foto 2 ou 3 vezes até dar certo, a UX da área de upload precisa ser refatorada para ser mais permissiva com formatos de imagem.

---

## Conclusão do UX Design
Recomendo incluirmos os gatilhos de **Rage Clicks** e a **Soma Estimada de Fuga (Leakage)** imediatamente no plano de telemetria, pois eles pagam o custo da implementação nas primeiras 24h de análise real.

---
*Documento gerado via persona @ux-ui sob orquestração do @maestro.*
