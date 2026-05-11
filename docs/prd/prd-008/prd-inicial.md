# PRD-008 — Observabilidade Hyper-Métrica & Inteligência Futura 📊🔮
> Versão: 3.0 (INTEGRAL E MAXIMALISTA) | Data: 2026-05-11 | Status: APROVADO PARA IMPLEMENTAÇÃO

## 1. Visão Geral do Negócio
Este ciclo visa transformar dados de comportamento de convidados em inteligência de negócios para a plataforma. O foco primordial é na **Lista de Presentes** (núcleo de rentabilidade) e no **Mapeamento Psicológico do Convidado**, permitindo rastrear o funil de conversão completo, identificar fugas de receita e alimentar futuros algoritmos preditivos de automação e recomendação.

---

## 2. Objetivos Estratégicos (KPIs)
1.  **Monetização (Gifts)**: Medir a taxa de conversão por item, tempo de retenção e desistência.
2.  **Vazamento de Lucro (Leakage)**: Quantificar cliques no botão "Comprar em loja recomendada" vs "Presentear na Cota Virtual".
3.  **Engajamento de Convite**: Mapear zonas de maior tempo de permanência visual por seção (Carousel, História, Noivos, Agenda).
4.  **Fidelidade Operacional**: Mapear taxa de erros/desistências na submissão de mídias no Mural e comprovantes de pagamento.

---

## 3. Requisitos Funcionais Detalhados (O Que Monitorar)

### 3.1. Fluxo do Convite (Zonas de Interesse e Comportamento)
*   **Tempo de Visualização por Seção**: Rastrear via sensores de visibilidade quanto tempo cada seção (História, Agenda, etc) permanece na viewport do convidado.
*   **Contagem de Recorrência Individual**: Identificar se o mesmo convidado acessou múltiplas vezes o link antes de tomar qualquer ação, gerando o dado para o futuro módulo de "Convidado Fantasma".
*   **Funil de Abandono do RSVP**: Registrar o clique inicial no botão RSVP, os campos preenchidos e em qual exato ponto o formulário foi fechado sem conclusão.

### 3.2. Fluxo do Mural de Lembranças (Retenção e Frustração)
*   **Tempo Médio de Navegação e Visualização**: Tempo total gasto lendo mensagens e interagindo com o carrossel de fotos.
*   **Eventos de Frustração de Mídia**: Capturar tecnicamente falhas em uploads de imagem ou desistências no meio do processo de escrita de mensagem.

### 3.3. Fluxo da Lista de Presentes (Área Crítica de Monetização)
*   **Interesse Preditivo por Item**: Cliques exatos e TEMPO de permanência com o modal aberto para cada presente individualmente.
*   **Otimização do Carrinho**: Rastrear quais itens entram juntos na cesta (`cart_combination`) para futuros módulos de clusterização ("quem comprou X também gostou de Y").
*   **Rastreamento de Fuga Financeira**: Monitorar cliques direcionados a "Lojas Externas" somando o potencial financeiro perdido por essa conveniência.
*   **Resiliência de Pagamento (Checkout)**: Contagem granular de erros de upload de comprovante e retentativas do usuário até o sucesso final.

### 3.4. Sensores de Psicologia do Usuário (UX Avançado)
*   **Rage Clicks (Cliques de Frustração)**: Registrar clicks múltiplos (>3x em 2s) em botões, denunciando atrito ou bugs silenciosos.
*   **Tempo de Hesitação na Chave PIX**: Medir o intervalo entre a exibição do QR Code/Chave PIX e o upload do comprovante, sinalizando fricção no "copia e cola".
*   **Ponto de Evasão de Scroll (Depth)**: Registrar qual é a última seção visível no momento exato que o usuário fecha o site.

---

## 4. Visão de Mercado e Vantagem Competitiva (Tese Disruptiva)

Nos posicionamos contra o modelo "Black Box" (Caixa Preta) de incumbentes como iCasei e Casar.com:
1.  **Transparência Radical**: Ninguém mais no mercado mostra o "Custo Real do Desvio" ou o tempo de atenção por seção.
2.  **Inteligência Preditiva**: A nossa telemetria alimenta algoritmos futuros que tomam decisões de negócio pelo organizador.

---

## 5. Mapa do Futuro (O que os dados colhidos hoje habilitarão amanhã)
Esta PRD obriga a inclusão de metadados específicos para viabilizar os seguintes módulos em roadmaps futuros:
*   **Vitrine Autônoma (FOMO)**: Ordenação dinâmica da lista colocando itens mais desejados no topo automaticamente.
*   **Preditor de Buffet**: Curva matemática para prever a confirmação real com base na velocidade inicial de resposta.
*   **Reordenador de Narrativa**: Mover seções do site baseando-se em dados reais de abandono de scroll.

---

## 6. Tese de Arquitetura de Dados (Tabela analytics_events)

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | Chave primária auto-gerada |
| `evento_id` | `UUID` | Chave estrangeira (FK eventos.id) |
| `session_id` | `TEXT` | ID anônimo para agrupar ações da mesma visita |
| `categoria` | `TEXT` | Enum: `invite`, `mural`, `gift` |
| `evento_tipo` | `TEXT` | Nome da ação (`section_view`, `cart_add`, `rage_click`, etc) |
| `target_id` | `TEXT` | ID complementar (ID do Presente ou Nome da Seção) |
| `duration_ms`| `INTEGER`| Tempo medido em milissegundos |
| `metadata` | `JSONB` | Objeto rico contendo Valores Financeiros, Tipos de Erro e Combinações de Carrinho |
| `created_at`| `TIMESTAMPTZ`| Timestamp exato da ocorrência (Essencial para análise de "Hora de Ouro") |

---
## 7. Compromisso Técnico
O Maestro e o Arquiteto garantem que a instrumentação dos itens acima seguirá o regime de **Zero Impacto na UI**, com execução em Threads ociosas e sem travar a experiência do usuário.

---
*Documento INTEGRAL E TOTALIZADOR homologado pela junta Maestro/BA/UX e Operador.*
