# PRD-012-A: Smart Gift List — A Fundação Inteligente
> **Fase:** DESCOBERTA (Escopo Consolidado - Bloco A)  
> **Autor:** @ba & @maestro  
> **Status:** APROVADO PARA DESENHO (Fase 1)  
> **Objetivo:** Facilitar o setup de presentes para o casal via catálogo global e organizar a vitrine do convidado com taxonomia canônica dinâmica.

---

## 1. Visão Geral do Bloco A
Esta fase estabelece a base estrutural da nova Lista de Presentes. Focamos 100% em facilitar a adoção do produto pelo casal (reduzindo o tempo de criação da lista para menos de 1 minuto) e em melhorar a navegação visual do convidado através de categorias vivas. Não há dependências de APIs externas nesta fase, garantindo velocidade total de entrega.

---

## 2. Requisitos Funcionais Detalhados

### RF01 - Taxonomia Canônica de Categorias (8 a 12)
*   Implementar o mapeamento fixo das 8 a 12 categorias ideais de casamento:
    1.  Cozinha & Utensílios
    2.  Eletrodomésticos
    3.  Cama, Mesa & Banho
    4.  Decoração & Organização
    5.  Lazer, Bar & Churrasco
    6.  Eletrônicos & Tecnologia
    7.  Móveis
    8.  Viagem, Cotas & Lua de Mel
*   O casal e o master devem poder selecionar apenas uma categoria canônica por presente.

### RF02 - Ordenação Dinâmica de Categorias (UX Viva)
*   Na vitrine de presentes pública (convidado), as abas (chips) de categorias não são estáticas.
*   **Algoritmo de Visualização:** As abas são reordenadas da esquerda para a direita priorizando automaticamente a categoria que acumulou o maior peso ponderado combinando cliques de interesse e presentes já ganhos no evento.

### RF03 - Catálogo SaaS Base (Vitrine Master Global)
*   Criação da tabela `public.presentes_base` gerenciada pelo Master.
*   Deve ser populada via script de Seed com 20 a 30 itens padrão do mercado de casamentos (Batedeira, Liquidificador, Jogos de Toalhas, Cotas de R$ 100 a R$ 500) contendo título, imagem padrão de altíssimo luxo e preço sugerido.

### RF04 - Importação em 1-Clique (One-Click Import UI)
*   **UX Administrativa:** Aba dedicada no painel do casal listando a vitrine do Catálogo SaaS.
*   O casal apenas clica no botão `[ + Adicionar ]` em cima do card do presente base. 
*   O sistema clona os dados do registro base para a tabela `public.presentes` ativa do casamento associado instantaneamente, gerando feedback visual imediato de sucesso.

### RF05 - Widget de Tendências Diárias (Daily Trending Widget)
*   Um bloco visual ("card widget") renderizado lateralmente no cockpit do casal.
*   Varre diariamente os produtos mais importados no ecossistema global.
*   Se houver um produto "quente" que o casal atual ainda não tem na lista, exibe a sugestão: *"🔥 Tendência de hoje: X casais adicionaram AirFryer Digital. Deseja adicionar na sua lista? [ Importar Agora ]"*.

---

## 3. Entidades de Banco de Dados (DDL Rascunho)
*   `public.presentes_base`: Tabela mestra contendo ID, Título, Categoria (Enum/FK), Imagem_URL, Preço_Referencia.
*   Alterações em `public.presentes`: Adição da FK `base_id` e coluna `categoria_slug`.

---

## 4. Critérios de Aceite (Milestone A)
1. [ ] O casal consegue rolar a vitrine de catálogo base e clonar presentes para sua lista com 1 clique.
2. [ ] O convidado visualiza as abas de categoria no topo, ordenadas pela popularidade do momento.
3. [ ] O painel exibe sugestões de produtos diariamente baseados em tendências.
