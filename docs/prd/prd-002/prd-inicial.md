# PRD-002 — Nova UI & Experiência Premium (Majestosa)
> Versão: 1.0 | Data: 2024-05-24 | Status: CONCLUÍDO (Concluído)

## 1. Contexto e Visão Geral
O InviteEventAI já possui uma base funcional robusta (consolidada no PRD-001). Agora, o foco migra da "funcionalidade bruta" para a "experiência emocional". Um casamento é um evento único e "majestoso"; a plataforma deve refletir esse sentimento em cada pixel, transição e interação. 

Este PRD visa elevar o produto ao patamar de solução *High-End* no mercado de convites digitais.

## 2. O Problema
Plataformas concorrentes costumam ser ou excessivamente complexas (curva de aprendizado alta) ou visualmente datadas/genéricas. Noivos sentem que o convite digital é uma "versão barata" do físico. Precisamos quebrar essa percepção, transformando o digital em uma experiência premium e envolvente que gere orgulho nos noivos e admiração nos convidados.

## 3. Objetivos de Negócio
- **Posicionamento de Mercado:** Tornar-se a referência em "Beleza e Fluidez" para eventos premium.
- **Conversão:** Aumentar a taxa de conversão na Landing Page através de um impacto visual imediato ("O efeito WOW").
- **Retenção/Viralidade:** Fazer com que os convidados, ao verem o convite, queiram usar a plataforma para seus próprios eventos futuramente.
- **Eficiência:** Reduzir o tempo de onboarding, entregando um convite pronto e bonito em menos de 3 minutos.

## 4. Personas

### 4.1. Os Noivos (Os Visionários)
- **Perfil:** Buscam perfeição estética, são exigentes com detalhes e valorizam o próprio tempo.
- **Desejo:** Um convite que seja "a cara deles", mas sem o estresse de configurar dezenas de opções. Querem algo "mágico" e pronto.
- **Dor:** Medo de que o convite digital pareça amador ou que o sistema seja difícil de gerenciar.

### 4.2. O Convidado (O VIP)
- **Perfil:** Recebe o link via WhatsApp/E-mail. Acessa majoritariamente via mobile.
- **Desejo:** Sentir-se importante e bem-vindo. Quer ver fotos, confirmar presença e presentear de forma rápida e fluida.
- **Dor:** Convites travados, lentos, com formulários de RSVP chatos ou que não funcionam bem no celular.

## 5. Requisitos de Experiência (Majestade Visual)

### 5.1. Landing Page "Impactante"
- **Hero Section:** Uso de vídeos em slow-motion ou imagens de alta qualidade com máscaras elegantes.
- **Tipografia:** Combinação de fontes serifadas (clássicas/luxuosas) com sans-serif (modernas/limpas).
- **Narrativa Visual:** A página deve contar uma história conforme o usuário faz o scroll, usando *parallax* sutil e animações de entrada coordenadas.

### 5.2. Onboarding "Fluido e Mágico"
- **Fluxo de Criação:** Perguntas simples que resultam em uma pré-visualização instantânea e "viva" do convite.
- **Micro-interações:** Feedback visual imediato em cada campo preenchido (ex: o convite ao lado sendo atualizado com uma transição suave).
- **Sem Atrito:** O usuário deve chegar ao "Aha! Moment" (ver seu convite pronto) com o mínimo de cliques possível.

### 5.3. Experiência do Convidado (Feeling Premium)
- **Abertura do Convite:** Animação de "revelação" ou "abertura de envelope digital" que seja fluida e não intrusiva.
- **Navegação:** Scroll suave (smooth scroll) entre seções (Local, Presentes, RSVP, Mural).
- **Botões e Call-to-Actions:** Estados de hover e clique com transições elegantes (ex: glow sutil ou mudança suave de cor).

### 5.4. Mural de Fotos "Premium" (Destaque)
- **Exibição Dinâmica e Intercalada:** As fotos enviadas pelos convidados aparecem em um grid dinâmico (Masonry/Pinterest) intercaladas com cartões de mensagens elegantes enviadas por convidados. Mensagens curtas podem sobrepor as fotos de forma estilosa.
- **Dinamismo em Tempo Real (Efeito Mágico):** Periodicamente, fotos e mensagens se movimentam, somem/aparecem em outros cantos do grid através de efeitos de desfoque/fade, criando um painel vivo e mutável.
- **Botão "Eternizar Momentos"**: Botão proeminente de ação no topo da galeria que permite o envio intuitivo de uma ou mais fotos acompanhadas de uma mensagem carinhosa.
- **Regra de Negócio Crítica (Moderação Obrigatória):** Para garantir a privacidade e o respeito ao evento, **todas** as fotos e mensagens enviadas por convidados devem ser previamente aprovadas por um organizador (no painel administrativo) antes de serem exibidas no mural dinâmico pública.

### 5.5. Painel Administrativo "Simplista e Belo"
- **Dashboard Limpo:** Foco em métricas essenciais (Total de Confirmados, Valor em Presentes, Novas Fotos).
- **Configurações:** Menus intuitivos, sem excesso de subníveis. O design deve respirar (espaçamento generoso).

## 6. Escopo Detalhado (O que entra)
- [ ] **Redesign Completo da LP:** Nova paleta de cores, fontes e ativos visuais.
- [ ] **Novo Fluxo de Onboarding:** Foco em velocidade e visualização em tempo real.
- [ ] **Motor de Animações:** Implementação de Framer Motion em todo o projeto para garantir a "majestade" das transições.
- [ ] **Mural de Fotos 2.0:** Design premium, exibição aleatória e botão de upload integrado.
- [ ] **Convite Guest-View:** Revisão completa da interface de visualização do convidado para mobile-first premium.
- [ ] **Admin UI:** Refatoração das telas de gestão para o novo padrão visual.

## 7. O que NÃO entra (Fora de Escopo)
- [ ] Novas funcionalidades de check-in presencial no evento.
- [ ] Integração com fornecedores externos (Buffet, Fotógrafos).
- [ ] App Mobile Nativo (foco total em PWA/Web Responsivo Premium).

## 8. KPIs (Sucesso)
- **Aumento de 25% na taxa de conversão** da LP (visitante -> cadastro).
- **Redução de 40% no tempo médio** de criação do primeiro evento.
- **NPS do Convidado:** Coletar feedback qualitativo sobre a "beleza" e "facilidade" do convite.

## 9. Riscos e Mitigações
- **Performance vs Animações:** Excesso de animações pode pesar em celulares antigos. 
    - *Mitigação:* Usar GPU-accelerated animations e fazer testes rigorosos de performance.
- **Complexidade de Customização:** Se dermos muitas opções, os noivos se perdem. 
    - *Mitigação:* Focar em "Temas Majestosos" pré-definidos que já garantem o bom gosto.

---
**Próximos Passos:**
1. Validação deste PRD pelo Operador.
2. Envio para o `@ux-ui` para criação do Design System e Wireframes Majestosos.
3. Definição da stack de animações (Framer Motion confirmada).