# Fluxo UX/UI — PRD-015 (Booster de Conversão & FOMO) 🎨✨

> **Fase:** EXPERIÊNCIA | **Responsável:** @ux-ui | **Data:** 15 de Maio de 2026  
> **Objetivo:** Criar gatilhos psicológicos e visuais que aceleram a conversão mantendo o rigor estético e a sensação de luxo da plataforma.

---

## 🌐 1. Visão Geral do Fluxo Visual

A experiência foca em dois agentes:
1. **O Convidado (Vitrine Pública):** Sentir urgência saudável e segurança de que o casal está engajado (Prova Social).
2. **O Organizador (Dashboard Admin):** Receber conselhos inteligentes e acionáveis para otimizar a lista na reta final do casamento.

---

## 📲 2. A Jornada do Convidado (Vitrine de Presentes)

### A. Badges Flutuantes de Impacto (FOMO Ativo)
Os badges herdam o estilo "Glassmorphism" com gradientes sutis e não-intrusivos localizados no canto superior esquerdo da foto do presente:
*   **Badge 🔥 Favorito dos Convidados:** Para o topo 3 de cliques.
    *   *Background:* `linear-gradient(135deg, #FF8C00, #FF4500)`
    *   *Animação:* Entrada com scale sutil e ícone pulsando de leve.
*   **Badge ⭐ Em Alta na Semana:** Para maior volume de views 48h.
    *   *Background:* `linear-gradient(135deg, #D4AF37, #AA771C)`

### B. Overlay de Visualizações Simultâneas (⚡ Realtime Insight)
Um rodapé semitransparente no próprio card da foto que surge apenas se o interesse recente for alto:
*   *Mensagem:* `"⚡ 3 pessoas estão vendo agora"`
*   *Estilo:* Escuro translúcido com um **Radar Pulse Red** (ponto vermelho piscando em expansão infinita simulando dados em tempo real).

### C. Transição de Ordenação Inteligente (Smart Sorting)
*   Ao carregar a lista, o frontend reposiciona os cards suavemente usando o Framer Motion (`layoutId` ou transições de grid).
*   Itens "quentes" sobem; itens já comprados ou sem cota descem.

---

## 🔒 3. A Jornada do Organizador (Dashboard Administrativo)

### A. Banner "IA Price Suggester"
Um container sofisticado posicionado acima da listagem de presentes, ativado condicionalmente para casamentos sem presentes a menos de 45 dias da data.
*   **Identidade:** Dark Glass com borda dourada fina (`rgba(197, 160, 89, 0.3)`).
*   **Texto persuasivo:** Exemplo: *"Sua lista pode vender 35% mais rápido dividindo o Robô Aspirador (R$ 1.200) em cotas!"*
*   **Ações Rápidas:**
    1.  **Botão Dourado "🪄 Aplicar Recomendação":** Efeito de shimmer que, ao clicar, executa o update instantâneo.
    2.  **Botão Secundário "Ignorar":** Remove o banner suavemente liberando espaço útil de tela.

---

## 🛠️ 4. Protótipo Físico de Validação

Foi desenvolvido um protótipo 100% funcional com CSS Puro e Vanilla JS reproduzindo fielmente as animações do radar, a troca de grid e o banner administrativo:
👉 **[booster-conversao-fomo.html](file:///c:/Users/ivanl/Downloads/casamento/InviteEventAI/docs/wireframes/booster-conversao-fomo.html)**

---

> **Validação UX:** Layouts projetados sob a premissa de **Performance First**. Os badges usam apenas aceleração de GPU (transform & opacity) garantindo 60fps em qualquer aparelho móvel! Pronto para a etapa de **Arquitetura Técnica (@architect)**.
