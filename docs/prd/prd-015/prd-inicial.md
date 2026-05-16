# PRD-015 — Resgate de Sonhos & Sintonia dos Convidados (Aceleração Emocional) 🕊️✨

> **Versão:** 2.0 | **Fase:** REDESCOBERTA ESTRATÉGICA | **Data:** 15 de Maio de 2026  
> **Status:** REVISADO E VALIDADO (Aesthetic Upgrade)  
> **Contexto de Valor:** Aceleração sutil e elegante de presentes baseada em prova social afetiva (Social Proof Emocional), substituindo a ansiedade fria do varejo tradicional pela celebração e realização de desejos do casal.

---

## 1. Visão Geral do Negócio & Resignificação do "FOMO"
O varejo tradicional usa a urgência e a escassez ("apenas 1 no estoque", "30 pessoas vendo agora") de forma utilitária e por vezes agressiva. Em um casamento de luxo, isso soa inadequado e quebra a aura de celebração e elegância. 

Para a nossa plataforma, o gatilho de conversão não é o "medo de perder", mas a **Vontade de Agradar** e a **Sintonia Social** (querer participar dos momentos mais importantes dos noivos). Por isso, convertemos a telemetria fria em **Mensagens de Afeto e Sonhos**.

### 🎯 A Nova Semântica Matrimonial (Aesthetic Lexicon)
| Linguagem Fria (Varejo) | Nossa Linguagem (Afetiva & Luxo) | Gatilho Psicológico Ativado |
| :--- | :--- | :--- |
| **🔥 Mais Vendido / Favorito** | **💖 Um Grande Sonho dos Noivos** | Desejo de realização emocional direta. |
| **⚡ 3 pessoas visualizando** | **✨ Muito visitado pelos convidados** | Validação social sutil ("Escolha querida"). |
| **⭐ Destaque da Semana** | **💍 A Escolha Clássica da Lista** | Segurança na escolha (baixo risco de errar). |
| **🚨 Urgência / Acabando** | **🕊️ Quase realizado! Restam [X] cotas** | Efeito de colaboração ("Vamos fechar juntos!"). |

---

## 2. Requisitos Funcionais (RF)

### RF001 — Selos de Simpatia & Desejos (Visual Afetivo)
*   **Descrição:** Inserir discretamente selos estilizados com a tipografia Serif do casamento e ícones elegantes.
*   **Regras de Exibição:**
    *   **Selo "Grande Sonho do Casal" (Manual + Inteligência):**
        *   **Flag Manual:** O administrador pode marcar presentes específicos com a flag `is_sonho_casal`. Estes itens ganham prioridade absoluta na vitrine e o selo permanente.
        *   **Inteligência:** Caso nenhum item seja marcado manualmente, a inteligência atribui ao item com maior desejo histórico.
    *   **Selo "O Clássico da Nossa Lista" (Inteligência):** Atribuído automaticamente pela telemetria.
    *   **Rodapé de Sintonia "Muito Cogitado" (Discreto):**
        *   Exibido apenas como um ícone minimalista (ex: brilho ou estrela).
        *   O texto explicativo ("Este item tem atraído a atenção...") deve aparecer apenas ao passar o mouse (Tooltip).
        *   **Proibido o uso de Emojis padrão do sistema; utilizar biblioteca de ícones (Lucide/SVG).**

### RF002 — A Vitrine Autônoma de Afeto (Smart Sorting Light)
*   **Descrição:** O algoritmo organiza os presentes puxando os itens com maior afinidade e carinho para o topo da tela.
*   **Hierarquia de Ordenação:**
    1.  Itens marcados manualmente como **"Sonho do Casal"** (ordem de inserção entre eles).
    2.  Itens com maior **Score de Afinidade** (cliques/cesta).
    3.  Itens esgotados (sempre ao final).

### RF003 — Mentor de Carinho (Advisory Admin para os Noivos)
*   **Descrição:** Central de aconselhamento no painel do admin.
*   **Novas Ações de Controle:**
    *   **Campo "Sonho do Casal":** Checkbox no cadastro/edição de presentes para marcar a flag `is_sonho_casal`.
    *   **Destaque Sugerido:** O mentor pode sugerir: *"Notamos que você ainda não definiu um 'Grande Sonho'. Que tal marcar este item para ganhar destaque especial?"*

---

## 3. Requisitos Não-Funcionais (RNF)
1.  **Estética e Frame-Rate:** A animação de "Glow" (Brilho) deve ser ultra-suave, usando transições de opacidade em CSS e sombras suaves ao invés de alertas piscantes de alta frequência.
2.  **Zero Poluição:** Um card de presente só pode receber no MÁXIMO um único selo por vez para manter a elegância geométrica do grid.

---

## 4. O Que NÃO Entra Neste Escopo (Out of Scope)
*   Não utilizaremos cores de alerta puro (Red #FF0000 ou Orange #FF7F00) no frontend público de convidados.
*   Uso de timers regressivos ou relógios na vitrine de presentes.

---

> **Validação Requerida:** Operador, reposicionamos completamente a solução para falar a língua de um casamento real de alto padrão. Esta tradução humanizada ressoa com o tom da InviteEventAI? Se aprovado, atualizaremos o protótipo físico com esses novos termos e cores! 🕊️🥂

---

## 3. Requisitos Não-Funcionais (RNF)
1.  **Performance de Renderização:** O processamento do Score de Interesse para ordenação da vitrine deve rodar em menos de **100ms** no servidor ou ser efetuado client-side com os dados já hidratados, evitando atrasos visualmente perceptíveis (FCP) na abertura da vitrine.
2.  **Cache de Agregação:** A consulta na tabela `analytics_events` para coletar cliques e visualizações do dia deve ser cacheada por 1 minuto (60s) para não sobrecarregar as conexões do Supabase se muitos convidados acessarem a vitrine ao mesmo tempo.

---

## 4. O Que NÃO Entra Neste Escopo (Out of Scope)
*   Envio automático de e-mails ou disparos de WhatsApp ativamente (essas notificações ficam para a FASE 3 do Roadmap).
*   Reordenamento baseado em Inteligência Artificial complexa/Machine Learning na nuvem (usaremos agregações SQL simples para o MVP do Algoritmo).

---

## 5. Matriz de Aceite do QA (Draft)
*   **Cenário 1:** Convidado abre a lista de presentes. Os 3 itens mais clicados historicamente aparecem obrigatoriamente nas primeiras posições da lista e carregam o selo "Favorito".
*   **Cenário 2:** Noivo acessa painel de presentes. O sistema exibe um banner de alerta inteligente sugerindo o fracionamento de uma geladeira de R$ 1.500 em cotas. Ao aceitar, o item é atualizado instantaneamente e o alerta some.

---

> **Validação Requerida:** Operador (@Ivan), este PRD Inicial cobre a dor do seu casamento piloto e as mecânicas táticas que você espera ver em produção? Se sim, avançaremos para a fase de **Experiência/Arquitetura**.
