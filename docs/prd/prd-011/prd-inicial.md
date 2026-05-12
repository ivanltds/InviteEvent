# PRD-011: Modo Telão Realtime (Slideshow Evento)
> **Fase:** DESCOBERTA (PRD Inicial)  
> **Autor:** @ba (Business Analyst)  
> **Objetivo:** Encantamento do cliente no dia do evento através de um visualizador dinâmico para TVs e projetores.

---

## 1. Visão Geral
Transformar o "Mural de Fotos e Recados" existente em uma ferramenta ativa de entretenimento para o dia do casamento. Uma rota dedicada otimizada para proporções 16:9 exibirá HIBRIDAMENTE as fotos e as mensagens capturadas pelos convidados em tempo real, com animações premium, respeitando a identidade visual (fontes serifadas, aspas, autoria) já consolidada na plataforma.

---

## 2. Objetivos de Negócio (Impacto Imediato)
1. **Ativação Orgânica:** Estimular os 117 convidados a tirarem fotos e/ou escreverem mensagens carinhosas.
2. **Valor Afetivo e Estético:** Entregar não só imagens, mas os votos dos convidados legíveis na TV durante a festa.
3. **Reaproveitamento Tecnológico:** Utilizar 100% da estrutura de dados já criada para o Mural Público.

---

## 3. Requisitos Funcionais

### RF01 - Rota Fullscreen Dedicada
*   **URL:** `/(public)/[event_slug]/tv` ou similar.
*   Layout limpo, fundo escuro premium (Black/Gold do Design System).
*   Sem menus, barras de navegação ou elementos que poluam a tela da TV.

### RF02 - Slideshow Automático (Carousel Infinito)
*   As fotos já enviadas no Mural devem rotacionar a cada 6 a 8 segundos.
*   Animações suaves de transição (Crossfade ou Scale-Up leve).
*   Redimensionamento inteligente (`object-fit: contain` ou `cover` com fundo desfocado) para lidar com fotos verticais e horizontais na TV 16:9.

### RF03 - Atualização Realtime (Prioridade Máxima)
*   Quando uma nova foto for aprovada/inserida na tabela `mural_fotos`, a TV deve detectá-la instantaneamente via Supabase Realtime.
*   A nova foto deve **furar a fila** da rotação e aparecer imediatamente como a próxima, possivelmente com uma animação de "Destaque Novo!".

### RF04 - QR Code Overlay
*   Um box elegante no canto inferior (direito ou esquerdo) com um QR Code apontando para a página de upload de fotos pública do evento.
*   Texto de chamada: "Envie sua foto para o telão!"

---

## 4. Critérios de Aceite (MVP para 1 Cliente)

1. [ ] Ao abrir a URL da TV, carregar automaticamente as últimas N fotos já existentes.
2. [ ] O slide deve rodar infinitamente sem intervenção humana.
3. [ ] Ao inserir manualmente uma foto no banco via dashboard, a TV deve recebê-la e exibi-la no próximo ciclo sem precisar dar F5 (Reload).
4. [ ] O design deve ser responsivo para telas Full HD (1080p) e 4K.

---

## 5. Próximos Passos
1. **@maestro:** Validar escopo com o Operador.
2. **@ux-ui:** Criar wireframe/mockup visual do Modo Telão (considerando o fundo desfocado para fotos verticais).
3. **@architect:** Mapear a lógica de escuta (subscription) do Supabase e a fila de exibição dinâmica.
