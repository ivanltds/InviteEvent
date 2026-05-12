# Fluxo UX - Modo Telão Realtime (PRD-011)

Este documento descreve o mapeamento visual e comportamental do ambiente de projeção para o dia do evento.

## 1. Arquitetura de Informação
- **Nova Rota Pública:** `/event/[slug]/tv`
- **Contexto:** Visualizador passivo projetado em TVs Smart ou Datashows de alta resolução (1080p / 4K). Sem interação por mouse/teclado após inicialização.

## 2. Composição Visual (Layout Integrado 16:9)
1. **Modo Híbrido (Split Screen):** Divide a TV em duas áreas. Do lado esquerdo, a foto com bordas infinitas (mesmo visual do site). Do lado direito, o recado em fontes serifadas grandes e aspas estilizadas, respeitando o design do componente `textOnlyCard` do Mural.
2. **Modo Apenas Recado:** Se o convidado enviar apenas texto, a tela assume o layout inteiro de "Papel Cartão Elegante", maximizando a leitura da mensagem de carinho.
3. **Camada Informativa (Identidade):** Um rodapé discreto no canto inferior direito com o QR Code e o link para "Compartilhar sua Lembrança", estimulando o envio contínuo de conteúdo.

## 3. Matriz de Animações & Estados
| Estado | Gatilho | Animação |
| :--- | :--- | :--- |
| **Transição Slide** | Intervalo de 8s | Fade out da foto anterior e Slide-in + Scale suave (0.95 -> 1) da nova foto. |
| **Nova Foto Recebida** | Webhook Realtime | Inserção imediata no topo da fila de exibição. |
| **Banner Alerta** | Nova Foto | Card dourado desliza do topo da tela: "✨ NOVA FOTO RECEBIDA!", dura 3 segundos e some. |

## 4. Protótipo Disponível
*   **Arquivo:** `docs/wireframes/modo-telao-tv.html`
*   **Componentes Inclusos:** Simulação de slideshow e simulação de injeção Realtime.
