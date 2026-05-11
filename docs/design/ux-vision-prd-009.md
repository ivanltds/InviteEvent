# UX Vision & Wireframe Specs: Smart Support Hub (PRD-009)

## 🎨 Conceito Visual: "The Watchtower" (A Torre de Controle)
A experiência de UX deve transmitir **segurança, clareza e controle absoluto**. Como se trata de um ecossistema de suporte híbrido, o administrador precisa saber instantaneamente **quem está no comando** da conversa sem precisar ler logs técnicos.

---

## 🧩 1. Componente: Sidebar Notification Badge (Master View)
### Comportamento:
- O item `Suporte` no menu lateral ganha um indicador numérico flutuante.
- **Cor**: `#ef4444` (Vermelho Intenso/Alerta).
- **Animação**: Pulso suave (breathe animation) se houver mais de 1 chat aguardando humano há mais de 5 minutos.
- **Gatilho**: Quando `chat_sessions.needs_human_attention = true`.

---

## 🖼️ 2. Interface: Central de Treinamento da IA (Treinamento Master)
### Layout Proposto:
- **Header**: Título "Cérebro da IA" com um subtítulo discreto: "Defina a alma do atendimento automatizado".
- **Seção Direita (O Editor)**:
  - Um `Textarea` expansível e estilizado em dark mode com fonte mono-espaçada para o prompt.
  - Botão "Salvar Nova Matriz".
- **Seção Esquerda (Quick-Guides)**:
  - Cards contendo variáveis injetáveis dinamicamente (ex: `{issues_recentes}`, `{regras_evento}`).
- **Estética**: Estilo terminal minimalista, focado na escrita limpa, fundo levemente mais escuro que o padrão para isolar a concentração.

---

## 📋 3. Interface: Painel Kanban de Issues (Rastreador)
### Layout Proposto:
- Grid de 4 colunas (ou abas dinâmicas):
  1. **ABERTA**: Badge Amarelo Pulsante.
  2. **VISUALIZADA**: Badge Azul Tranquilo.
  3. **CORRIGINDO**: Badge Laranja (Trabalho em Andamento).
  4. **RESOLVIDA**: Badge Verde Sólido.
- **Card da Issue**:
  - Título do Erro.
  - Origem: Identificador do Chat que gerou o ticket (clicável para ler a conversa).
  - Timestamp de criação.
  - Ações Rápidas: Botão para alterar o status direto no hover.

---

## 💬 4. Interface: Chat Hub (Visualização da Conversa Híbrida)
Aqui é onde a UX resolve a maior fricção: a transição de IA para Humano.

### Topbar do Chat:
- Um switch toggle estilo IOS em destaque: `[🤖 IA Controlando] | [Desativar Bot]`.
- **Indicador de Status**:
  - Ativo: Borda superior do chat brilha em Dourado/Gold (`var(--gold-primary)`).
  - Inativo (Humano): Borda muda para um Azul Cobalto Sólido (Seriedade e Foco).

### Na Janela de Mensagens:
- Mensagens enviadas pela IA devem ter um pequeno selo discreto `✧ AI` ao lado do nome para o administrador saber o que ela respondeu.
- Ao desligar o Bot:
  - Injetar automaticamente no histórico visual um separador: `--- 🔒 IA Suspendida por Intervenção Humana ---`.
- **Área de Edição**: Fica bloqueada (desabilitada) visualmente se o bot estiver falando para evitar conflito de escrita simultânea, habilitando instantaneamente ao desligar o Bot.

---

## 🚀 Próximos Passos Sugeridos
1. @Operador valida essa visão e layout macro.
2. Geramos um **Protótipo Visual HTML Estático** no navegador para você "sentir" o switch do chat e o kanban antes de codarmos a lógica real no backend.

> **Aprovação:** Posso avançar para o Protótipo Visual Estático baseado nessas specs?
