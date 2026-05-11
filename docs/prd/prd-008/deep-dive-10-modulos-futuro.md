# Top 10 Módulos de Futuro e Mapeamento de Dados (Deep-Dive) 🧠💎
> Mapeamento Estratégico Avançado | @ba specialist | Data: 2026-05-11

Abaixo está a visão profunda solicitada pelo Operador: 10 novas verticais de produtos baseados em dados e quais sinais vitais precisamos capturar hoje para habilitá-las amanhã.

---

### 🚀 VERTICAL 1: MONETIZAÇÃO E VENDAS (O CORE FINANCEIRO)

#### 1. O Motor de Clusterização ("Quem comprou X também deu Y")
*   **A Visão**: Recomendações inteligentes no carrinho de compras para aumentar o ticket médio.
*   **O Dado HOJE**: Capturar `cart_combination` (Quais itens entram na cesta juntos) e `related_item_views`.

#### 2. O Calculador de Elasticidade de Preços (Price Suggester)
*   **A Visão**: O sistema avisa o noivo: "Seu jantar custa R$ 400, mas em casamentos da sua região a média que converte é R$ 320. Deseja ajustar?".
*   **O Dado HOJE**: Capturar `view_to_conversion_ratio` cruzado com o valor nominal e CEP/Região do evento.

#### 3. Alavancagem de FOMO Temporal (O Módulo do Urgência)
*   **A Visão**: Inserir no topo: "⚡ 3 pessoas estão olhando a Cota de Lua de Mel agora!".
*   **O Dado HOJE**: Capturar o timestamp simultâneo de `active_view_users` por item.

---

### 🚀 VERTICAL 2: INTELIGÊNCIA OPERACIONAL (LOGÍSTICA DO EVENTO)

#### 4. Preditor de Confirmação Final (Overbooking Simulator)
*   **A Visão**: Prever com 95% de precisão a quantidade real de convidados que comparecerão, ajudando o casal a não pagar buffet a mais (redução de desperdício).
*   **O Dado HOJE**: Mapear a `rsvp_speed_curve` (Quantos dias do recebimento do link até a confirmação).

#### 5. O Painel do Buffet e Restrições (Catering AI)
*   **A Visão**: Gerar relatório PDF automático para o Chef de Cozinha com histograma de alergias, vegans e dietas especiais.
*   **O Dado HOJE**: Mapear e padronizar os `metadata_inputs` nos campos extras do RSVP.

#### 6. O Gerador Automático de Álbum de Agradecimento (Highlight Album)
*   **A Visão**: No dia seguinte ao evento, o sistema detecta as fotos do Mural com mais visualizações e cria um PDF de agradecimento "Best Moments".
*   **O Dado HOJE**: Capturar o `engagement_score` das mídias (Likes, clicks, view-time de cada foto no mural).

---

### 🚀 VERTICAL 3: MARKETING E CRESCIMENTO (VIRALIDADE)

#### 7. O Radar do Horário de Pico (The Golden Hour)
*   **A Visão**: Dizer ao noivo: "Seus convidados interagem mais aos Domingos às 20h. Mande o link agora!".
*   **O Dado HOJE**: Registrar o `heat_map_timestamp` de todos os eventos de telemetria globais.

#### 8. Identificação de "Advogados da Marca" (Micro-Influencers)
*   **A Visão**: Identificar convidados que compartilharam o link com MAIS pessoas e oferecer a eles uma vantagem ou um agradecimento especial.
*   **O Dado HOJE**: Rastrear o `share_button_clicks` e `unique_referrer_id` de quem gera novas sessões.

---

### 🚀 VERTICAL 4: OTIMIZAÇÃO DE PRODUTO (O NUCLEO UX)

#### 9. O Reordenador Dinâmico de Narrativa (Smart Layout)
*   **A Visão**: O sistema reordena as seções do site automaticamente. Ex: Se o "Carrossel de Fotos" tem 90% de abandono, ele joga a seção para o final para não atrapalhar o acesso à lista de presentes.
*   **O Dado HOJE**: Registrar `scroll_depth_exit` (Exatamente em qual seção o usuário fecha a aba).

#### 10. Detector de Saúde do Cliente (Anti-Churn Master)
*   **A Visão**: Avisar a você (Operador) quando um noivo parou de configurar o site pela metade para que você envie um suporte proativo de "resgate" antes que ele mude para a concorrência.
*   **O Dado HOJE**: Mapear o `admin_config_progress` (Qual porcentagem das configurações ele completou antes de 7 dias de inatividade).

---

## 🎯 CONCLUSÃO: O QUE PRECISA SER COLETADO HOJE?

Para que esses 10 módulos nasçam no futuro, **agora** na PRD-008, nossa tabela `analytics_events` DEVE registrar obrigatoriamente:
1.  **Timestamp Exato** (Para o Módulo 7)
2.  **Valores Monetários no Metadata** (Para o Módulo 2)
3.  **Ponto de Saída do Scroll** (Para o Módulo 9)
4.  **Agrupamento de Carrinho no Metadata** (Para o Módulo 1)

*Documento de Visão Futura consolidado e arquivado como Anexo da PRD-008.*
