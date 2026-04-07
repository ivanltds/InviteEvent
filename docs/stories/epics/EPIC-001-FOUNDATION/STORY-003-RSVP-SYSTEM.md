# STORY-003-RSVP-SYSTEM: Sistema de RSVP e Gestão de Convidados

## Descrição
Como convidado, desejo confirmar minha presença através de um formulário simples, informando a quantidade de acompanhantes e restrições alimentares. 
Como organizador, desejo que o sistema valide se a quantidade de pessoas confirmadas excede o limite do convite e me alerte sobre isso.

## Critérios de Aceitação
1. **Formulário Público:** Campos para Nome, Telefone (opcional), Confirmação (Sim/Não), Quantidade de Pessoas, Restrições Alimentares e Mensagem.
2. **Lógica de Convite:** O RSVP deve ser vinculado a um convite específico (simulado por um ID no link ou busca por nome).
3. **Validação de Excedente:** Se `confirmados > limite_convite`, o status do RSVP deve ser marcado como "Excedente solicitado" com alerta visual.
4. **Feedback Visual:** Exibição de prazo de confirmação e mensagem de agradecimento após o envio.
5. **Integração:** Preparar a estrutura de dados para o módulo de Gestão de Convidados (Admin).

## Detalhes Técnicos (Aria - Architect)
- Schema de Dados:
  - `Convite`: id, nome_principal, tipo (individual/casal/familia), limite_pessoas, status, link_slug.
  - `RSVP`: id, convite_id, confirmados, restricoes, mensagem, data_resposta.

## QA Scenarios (Quinn)
- [ ] Validar envio com quantidade dentro do limite.
- [ ] Validar envio com quantidade acima do limite (disparar status "Excedente").
- [ ] Validar campos obrigatórios.

## Status: DONE 🏆
