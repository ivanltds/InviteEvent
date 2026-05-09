# Fluxo de Experiência do Usuário (UX/UI) — PRD-003 🎨
> Responsável: UX/UI Specialist | Data: 2026-05-09 | Status: EXPERIÊNCIA (Em Revisão)

Este documento especifica a jornada do usuário, layouts de telas, estados de componentes e micro-interações para a funcionalidade de **Gestão do Master e Atendimento por Chat**.

---

## 1. Visão Geral da Experiência
A experiência de suporte deve se alinhar perfeitamente com a sofisticação da plataforma. Em vez de uma ferramenta de chat genérica, o design focará em minimalismo, elegância nos estados e total contextualização. O organizador do evento deve se sentir seguro e VIP ao falar com o Master, enquanto o Master deve ter um painel analítico extremamente limpo e focado.

---

## 2. Jornada do Organizador (User View)

### 2.1. O Botão Flutuante (Floating Action Button)
- **Visual**: Um círculo de 56px de diâmetro na cor **Midnight Ink** (`#1A1A1A`) com borda fina em **Royal Gold** (`#C5A059`) de `1px` e um ícone sutil de brilho (`✧`) centralizado em dourado.
- **Localização**: Fixo no canto inferior direito das telas administrativas do organizador (`right: 24px`, `bottom: 24px`), com `z-index: 1000`.
- **Micro-interações (Hover)**:
  - Transição suave de escala de `1.0` para `1.08`.
  - Mudança gradual de cor de fundo do Midnight Ink para um gradiente sutil.
  - Um leve glow dourado se projeta sob o botão.

### 2.2. O Widget de Chat Compacto
Ao clicar no botão flutuante, o chat abre-se como uma gaveta elegante (`bottom: 90px`, `right: 24px`, largura de `360px`, altura de `500px`):
- **Cabeçalho (Header)**:
  - Fundo Midnight Ink, com o título `"Atendimento Premium InviteEvent"` e subtítulo `"SLA de Atendimento: até 2h"`.
  - Botão de fechar (`&times;`) minimalista.
- **Visualização das Conversas (Chat History)**:
  - Se o usuário não tiver tickets abertos: Exibe uma tela inicial limpa com a mensagem: `"Como podemos tornar seu grande dia ainda mais mágico?"` e um botão proeminente `"Iniciar Nova Conversa"`.
  - Se houver histórico: Lista os tickets anteriores mostrando o status em formato de badge colorido e a data.
- **Área de Digitação (Input Area)**:
  - Textarea elegante com placeholder `"Escreva sua mensagem carinhosa para o suporte..."`.
  - Botão de enviar com o ícone de seta em Royal Gold.

---

## 3. Jornada do Master Admin (Master View)

### 3.1. Painel de Atendimentos (`/admin/master/suporte`)
Uma tela projetada com espaçamento generoso seguindo a filosofia do *White Space*:
- **Filtro Superior**: Abas de seleção entre `Aguardando Atendimento`, `Em Atendimento`, `Finalizados` e `Cancelados`.
- **Lista de Clientes (Histórico de Clientes)**:
  - Tabela listando nome do noivo/noiva, e-mail da conta, nome do evento cadastrado e volumetria de tickets.
- **Central de Atendimento Reativa**:
  - Layout dividido em duas colunas (Split View).
  - **Coluna da Esquerda**: Lista de tickets pendentes ordenados pelo tempo restante do SLA (do mais urgente ao menos urgente).
  - **Coluna da Direita**: Caixa de chat principal com o usuário selecionado e controles laterais para alteração de status do ticket.

---

## 4. Alertas de SLA e Estados Visuais (2h SLA Clock)
O tempo restante do SLA de 2 horas possui correspondência de cor estrita no painel do Master:
- **SLA > 1h 30m**: Badge verde (`#2ECC71`) com texto `"SLA Confortável"`.
- **30m < SLA < 1h 30m**: Badge amarela (`#F1C40F`) com texto `"Atenção SLA"`.
- **SLA < 30m**: Badge vermelha pulsante (`#E74C3C`) com texto `"Urgente: SLA Expirando!"`.

---

## 5. Próximos Passos
1. Validação deste mapeamento de UX pelo Operador.
2. Envio do documento para o `@architect` para elaboração do plano de infraestrutura de banco e integrações API.
