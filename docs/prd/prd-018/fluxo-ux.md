# Fluxo UX: Resiliência e Feedback Amigável (PRD-018) 🎨💎

> **Fase:** EXPERIÊNCIA  
> **Responsável:** @ux-ui (Designer UX/UI)  
> **Data:** 16 de Maio de 2026

---

## 1. Visão Geral
O objetivo deste fluxo não é criar novas telas, mas sim "blindar" a experiência existente com camadas de feedback que acalmem o usuário durante picos de 200+ acessos ou falhas de rede. 

**Diretriz Fundamental:** O design de erro deve ser **Context-Aware** (Ciente do Contexto), herdando o Design System da página onde ocorre. 
- **Lista de Presentes (Dinâmica):** Usará o padrão Luxo Gold/Champagne com Glassmorphism.
- **Admin Dashboard:** Usará o padrão Clean Enterprise (Inter + Grayscale + Royal Gold accents).
- **Consistência:** O componente de erro deve residir no módulo CSS da própria funcionalidade para garantir que fontes e tokens de cor sejam idênticos aos elementos da página.

## 2. Estados de Feedback Prioritários

### 2.1. O "Aguarde com Elegância" (High Concurrency)
- **Gatilho:** Quando o sistema detecta latência no banco de dados (ex: reserva de presente demorando > 2s).
- **Componente:** Overlay de vidro (Blur 10px) com um spinner customizado em dourado.
- **Texto:** *"Estamos preparando tudo para você. Por favor, aguarde um instante enquanto validamos sua escolha..."*
- **Ação:** Bloqueio de cliques duplos (debounce) para evitar race conditions.

### 2.2. O "Ops! Um Pequeno Ajuste" (Generic Failure)
- **Gatilho:** Timeout de rede ou erro 500 no backend.
- **Componente:** Modal centralizado com ícone de alerta minimalista.
- **Texto:** *"Tivemos um pequeno contratempo técnico devido ao alto volume de acessos. Não se preocupe, seus dados estão seguros. Deseja tentar novamente?"*
- **CTAs:** [Tentar Novamente] (Primary Gold) | [Falar com Suporte] (Ghost)

### 2.3. O "Bloqueio de Segurança" (Race Condition Prevention)
- **Gatilho:** Quando um convidado tenta reservar um item que acabou de ser reservado por outro (conflito de milissegundos).
- **Componente:** Toast animado (Framer Motion) no topo da tela.
- **Texto:** *"Este item acaba de ser escolhido por outro convidado. Que tal dar uma olhada em outras opções incríveis da lista?"*

## 3. Mapeamento de Jornadas Blindadas

### 3.1. Jornada de RSVP
1. **Início:** Clique no botão de RSVP.
2. **Feedback:** Badge de "Carregando..." imediato.
3. **Erro de Rede:** Exibe modal amigável com opção de "Enviar via WhatsApp" (fallback manual) se a API falhar persistentemente.

### 3.2. Jornada de Presente
1. **Seleção:** Clique em "Presentear".
2. **Reserva Atômica:** Loader de 1.5s (simulando segurança).
3. **Sucesso:** Animação de confete dourado minimalista.
4. **Falha:** Redirecionamento suave para a lista com toast explicativo.

## 4. Próximos Passos (Wireframes)
- [ ] Criar protótipo `docs/wireframes/resiliencia-feedbacks.html` demonstrando os 3 estados acima com as cores do Design System.

---

## 5. Definições do Operador (Refinamento)
1. **Tom de Voz:** Empático e acolhedor (ex: *"Tivemos um pequeno tropeço..."*).
2. **Fallback Manual:** Desativado. Manter foco na recuperação automática ou retry do sistema.
3. **Animações:** Implementar efeito "pulsar" (Glow Gold) nos botões de carregamento e transições.
4. **Intensidade do Blur:** Fundo 100% ilegível (Overlay opaco com blur intenso) para foco total na mensagem de resiliência.
5. **Ícones:** Estilo minimalista e artístico, evitando triângulos de alerta padrão.

---
*Assinado: @ux-ui (Designer UX/UI)*
