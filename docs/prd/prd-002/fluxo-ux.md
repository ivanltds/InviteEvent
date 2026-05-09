# Fluxo UX — PRD-002 — Nova UI

## Objetivo
Mapear a jornada completa dos Noivos e dos Convidados, garantindo que a nova estética de "Luxo Contemporâneo" seja aplicada em cada ponto de contato, reduzindo o atrito e maximizando o "efeito WOW".

## Jornada Ponta a Ponta

### 1. Jornada dos Noivos (Criação do Convite)
- **Descoberta:** O usuário acessa a Landing Page. Vídeo imersivo em background, tipografia elegante. Apenas um Call-to-Action claro: "Crie seu Convite Premium".
- **Onboarding Rápido:** Formulário step-by-step com design minimalista (apenas um campo por tela ou seções curtas). Feedback instantâneo.
- **Preview em Tempo Real:** Ao preencher os dados, o usuário vê o convite sendo montado ao lado com micro-interações.
- **Painel de Controle:** Dashboard limpo. Visão geral de RSVP, presentes recebidos e fotos do mural.

### 2. Jornada do Convidado (A Experiência do Evento)
- **Recebimento:** Link recebido via WhatsApp/E-mail. Preview do link com meta-tags otimizadas e imagem elegante.
- **Abertura do Envelope Digital:** Ao clicar no selo, a aba do envelope se abre e o cartão do convite desliza para fora. **ATENÇÃO (Regra de Transição):** A animação deve aproximar o cartão em direção à tela e revelar os textos suavemente. Em seguida, usando um efeito de desfoque (blur animation), o cartão se transforma e se expande para virar **a página atual do convite em tela cheia (100vh/100vw)**. O convite final não é um modal ou card solto, mas sim a página completa existente hoje.
- **Navegação no Convite:** Scroll suave entre seções na página final. Informações claras, botões grandes e acessíveis ("The Signature" button).
- **Interação:**
  - **RSVP:** Confirmação com 1 clique usando animação de "sucesso".
  - **Lista de Presentes Premium (E-commerce de Carinho):**
      - Um catálogo elegante exibe cotas de presentes virtuais (passeios de lua de mel, itens de decoração).
      - **Modal de Detalhes:** Ao selecionar qualquer presente, abre-se um modal de duas colunas, generoso e espaçoso para exibir fotos em alta resolução e descrições poéticas que engajam o convidado emocionalmente.
      - **Ações Duplas:** Oferece dois botões de conversão claros: "Presentear Agora" (checkout expresso direto para aquele item) e "Adicionar ao Carrinho" (permite consolidar múltiplas cotas ou lembranças em uma única transação simples, otimizando tarifas).
      - **Carrinho Inteligente:** Indicador visível de itens acumulados com feedback de badge dinâmico, permitindo revisão final antes de fechar as contribuições.
  - **Mural de Fotos Dinâmico & Vivo (Multimídia):** 
      - Um grid dinâmico intercala fotos, vídeos curtos em reprodução contínua (mudos/loop) e cartões de mensagens elegantes enviadas por convidados. Mensagens curtas podem sobrepor as mídias de forma estilosa.
      - **Efeito Mágico / Dinamismo:** Periodicamente, fotos, vídeos e mensagens trocam de lugar, somem ou reaparecem em outros cantos do grid com animações fluidas de fade/blur, trazendo dinamismo ao mural.
      - **Botão "Eternizar Momentos"**: Posicionado no topo, substitui o termo genérico de upload. Permite que o convidado selecione uma ou mais fotos/vídeos curtos (MP4, MOV, WebM até 15MB) e digite uma mensagem carinhosa para envio.
      - **Regra de Negócio Crítica (Moderação)**: Nenhuma foto, vídeo ou mensagem enviada por convidados aparece automaticamente no mural. Todas devem passar pela aprovação/moderação prévia de um organizador (no painel administrativo) antes de ficarem visíveis para os demais convidados.

## Estados
- **Vazio:** Telas com ilustrações ou ícones lineares muito sutis, acompanhados de micro-copy convidativa (ex: "Sua galeria aguarda os primeiros momentos").
- **Carregando:** Shimmers (esqueletos) com brilho suave e animações de fade. Evitar spinners padrão. Usar o logo ou um monograma pulsante.
- **Sucesso:** Animações curtas de check com confetes muito sutis ou partículas em tons de dourado (Royal Gold). Feedback tátil (se aplicável).
- **Erro:** Mensagens delicadas e compreensíveis. Cores de erro dessaturadas para não quebrar a estética premium. Ações claras de recuperação.

## Dúvidas Abertas
- Confirmar se teremos opção de modo escuro (Dark Mode) real ou apenas o "Soft Alabaster".
- Avaliar a viabilidade técnica de animações complexas de envelope em dispositivos muito antigos.