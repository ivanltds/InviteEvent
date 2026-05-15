# Especificação de UX e Fluxos de Consentimento (PRD-013)

Este documento descreve as jornadas do usuário e as especificações visuais para a implementação das mitigações de privacidade (LGPD) e links de conformidade no ecossistema **InviteEventAI**.

---

## 🎯 1. Diretrizes de Experiência (UX Core)
*   **Manter Imersão:** A leitura dos termos legais nunca deve redirecionar o convidado para fora da experiência do convite interativo ou do envelope digital.
*   **Interface Dinâmica:** Exibir avisos e requisições de consentimento apenas quando estritamente necessário para evitar ruído cognitivo e poluição visual.
*   **Fidelidade Visual:** Utilizar estritamente os padrões Dourado Minimalista (`#D4AF37`) e Fundo Translúcido (Glassmorphism) vigentes no Design System.

---

## 📐 2. Mapeamento de Fluxos e Telas

### 🛡️ Fluxo A: Consulta aos Documentos Legais (Termos e Privacidade)
*   **Ponto de Entrada (Rodapé):**
    *   Localizado no rodapé de todas as páginas públicas (`/`, `/presentes`, `/inv/[slug]`).
    *   **Estética:** Texto em tamanho reduzido (`0.75rem`), cor cinza suave (`rgba(255,255,255,0.5)`), flutuante e translúcido para não competir visualmente com as fotos de fundo dos noivos.
    *   **Conteúdo:** `© 2026 InviteEventAI • [Termos de Uso] • [Política de Privacidade]`
*   **Ação de Visualização (Modal Overlay):**
    *   Ao clicar nos links, o sistema **não** troca de rota. 
    *   Um **Modal Central com Efeito Glassmorphism** (fundo escurecido com desfoque) surge suavemente na tela (Framer Motion - Fade/Scale).
    *   O modal exibe o texto estilizado em markdown, permitindo rolagem interna e um botão de fechamento "Fechar" elegante e discreto no canto superior direito.

### 📝 Fluxo B: Consentimento de Dados Sensíveis no RSVP
*   **Ponto de Entrada (Formulário de RSVP):**
    *   Localizado na etapa de preenchimento de restrições de saúde/alergias alimentares.
*   **Comportamento Dinâmico (Gatilho):**
    *   O formulário padrão permanece minimalista.
    *   **Gatilho:** Se e somente se o convidado preencher o campo de texto de "Restrições Alimentares", um **Checkbox Animado** desliza suavemente logo abaixo do input.
    *   **Texto do Checkbox:** _"Autorizo o tratamento destas informações de saúde exclusivamente para o planejamento seguro do cardápio do evento."_
    *   **Regra de Validação:** Caso haja texto no campo de restrições, o envio do formulário é travado até que o convidado marque explicitamente o aceite de conformidade.

### 🍪 Fluxo C: Consentimento de Acesso Inicial (Cookie Banner)
*   **Ponto de Entrada (Primeiro Acesso):**
    *   Exibido uma única vez para visitantes novos na plataforma.
*   **Gatilho Temporal e Sequenciamento de Animações (Regra Crítica):**
    *   **Na Landing Page:** Surge **1 segundo** após o carregamento inicial da rota.
    *   **Na Página de Convite Dinâmico:** O banner deve aguardar o término completo da imersão e das animações do Envelope Digital (abertura e zoom). Surge apenas **5 segundos** após a ativação da página para garantir que nada interrompa o momento emocional inicial do convidado.
*   **Apresentação Visual:**
    *   Uma barra minimalista na base da página com `height: 60px`, fundo escuro escovado e uma linha sutil dourada no topo (`border-top: 1px solid rgba(212, 175, 55, 0.3)`).
    *   **Texto:** _"Utilizamos cookies fundamentais para garantir a segurança e a melhor performance da sua navegação. [Saiba mais]."_
    *   **Botão:** Botão dourado compacto escrito `"Aceitar"`.

---

## 📊 3. Visualização Administrativa (Console dos Noivos)

*   **Indicação de Privacidade:**
    *   Na tela `/admin/convidados`, ao abrir a ficha detalhada do convidado que possui restrições de saúde, o sistema exibe um ícone discreto de **Escudo Dourado** indicando que o consentimento LGPD foi legalmente coletado e registrado (Audit Log).
