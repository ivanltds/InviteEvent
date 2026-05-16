# Fluxo UX/UI — PRD-015 (Resgate de Sonhos & Carinho Coletivo) 🎨✨

> **Fase:** EXPERIÊNCIA | **Responsável:** @ux-ui | **Data:** 15 de Maio de 2026  
> **Objetivo:** Substituir os gatilhos frios de e-commerce por sentimentos de empatia, colaboração e realização de sonhos, mantendo o rigor estético e a sensação de celebração de luxo.

---

## 🌐 1. Visão Geral do Fluxo Visual

A experiência agora é guiada pelo conceito de **"Curadoria Afetiva"**:
1. **O Convidado (Vitrine Pública):** Sente que está contribuindo para a realização de grandes desejos do casal e identifica quais escolhas são mais bem acolhidas pela família.
2. **O Organizador (Dashboard Admin):** Recebe assessoria empática para tornar a lista mais convidativa e acessível para a sua rede social.

---

## 📲 2. A Jornada do Convidado (Vitrine de Presentes)

### A. Selos de Simpatia (Emotional Social Proof)
Os selos são desenhados para serem consistentes com a UI de botões do site, utilizando tipografia Sans-Serif em caixa alta, maior peso visual e ícones vetoriais:
*   **Selo "Grande Sonho do Casal":** Prioridade máxima. Pode ser definido manualmente pelo organizador ou via inteligência.
    *   *Estilo:* Fundo Rose Gold translúcido (`rgba(229, 193, 197, 0.9)`) com borda fina branca, texto em **Uppercase** e ícone de **Coração** (Lucide `Heart`).
    *   *Animação:* Efeito "Breathing" (respiro) de opacidade ultra-lento.
*   **Selo "Escolha Clássica":** Para itens com tráfego perene.
    *   *Estilo:* Fundo Champagne translúcido com texto em **Uppercase** e ícone de **Medalha/Honra** (Lucide `Award`).

### B. Rodapé de Sintonia e Atenção (Discreto + Hover)
Em vez de um banner fixo com texto, utilizamos um elemento minimalista:
*   **Visual:** Apenas um ícone discreto de Brilho (Sparkle) ou Estrela no canto do card ou rodapé.
*   **Interação:** O texto *"Muito cogitado pelos convidados recentemente"* aparece apenas quando o usuário passa o mouse (Hover/Tooltip), mantendo a vitrine limpa e sofisticada.
*   **Regra:** Uso obrigatório de Ícones (Lucide/SVG), proibido emojis padrão.

### C. Vitrine de Afinidade (Smart Sorting)
*   O reordenamento mantém itens cobiçados no topo, sob a marcação do filtro **"Mais Desejados ✨"** (substituindo a palavra "Popularidade" ou "Smart AI" no frontend).

---

## 🔒 3. A Jornada do Organizador (Dashboard Administrativo)

### A. Banner "IA Mentor de Sonhos"
*   **Identidade:** Fundo Creme Soft ou Dark Luxo com texto acolhedor.
*   **Texto persuasivo:** *"Queremos te ajudar a realizar seus grandes sonhos! 🎁 Notamos que o Robô Aspirador é um dos mais visitados. Dividir este item em cotas menores o torna muito mais acessível para que seus amigos possam presenteá-lo juntos!"*
*   **Ações Rápidas:**
    1.  **Botão "🪄 Acelerar Sonhos (Dividir em Cotas)":** Ativa a lógica fracionada instantaneamente.

---

## 🛠️ 4. Protótipo Físico de Validação

O protótipo foi totalmente remodelado com o novo Lexicon de Luxo, fontes Playfair Display sofisticadas, e animação de brilho dourado suave:
👉 **[booster-conversao-fomo.html](file:///c:/Users/ivanl/Downloads/casamento/InviteEventAI/docs/wireframes/booster-conversao-fomo.html)** (Convidado)  
👉 **[admin-booster-config.html](file:///c:/Users/ivanl/Downloads/casamento/InviteEventAI/docs/wireframes/admin-booster-config.html)** (Organizador)
