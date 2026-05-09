# Análise de Riscos e Mitigações — Banco de Dados Compartilhado (Dev/Prod)
> Autor: @architect | Status: CONCLUÍDO | Classificação: CRÍTICO

Este documento avalia os riscos técnicos e de segurança associados ao desenvolvimento de novos recursos (PRD-002) utilizando uma instância única de banco de dados compartilhada entre o desenvolvimento e a produção. Apresentamos estratégias de **custo zero** para garantir que os casamentos ativos permaneçam estáveis e seguros durante a transição.

---

## 1. Identificação de Riscos Críticos

### Risco 1: Bloqueios de Tabela (Locks) e Indisponibilidade de Casamentos Ativos
*   **Causa:** Execução de comandos DDL (`ALTER TABLE`) para adicionar colunas ou alterar tipos na tabela existente de `presentes`.
*   **Impacto:** O Postgres pode aplicar um bloqueio exclusivo (Exclusive Lock) na tabela durante a alteração, fazendo com que convidados de casamentos reais recebam erros de timeout ao tentar acessar a lista de presentes ou fechar transações no Stripe.

### Risco 2: Poluição Visual e Vazamento de Dados de Teste
*   **Causa:** Inserções de mídias e mensagens de teste durante o desenvolvimento da galeria de fotos.
*   **Impacto:** Fotos ou textos fictícios (gerados para testes) aparecendo acidentalmente no mural público de casamentos reais que estão ocorrendo no mesmo momento.

### Risco 3: Falha Lógica ou Sintática em Políticas de RLS (Row Level Security)
*   **Causa:** Ativação incorreta de políticas de segurança no banco compartilhado para a tabela de `mural_itens` ou afins.
*   **Impacto:** Bloqueio acidental das leituras gerais de convidados legítimos ou vazamento de fotos privadas enviadas para outros casamentos.

---

## 2. Plano de Mitigação Absoluta (Custo Zero)

Para eliminar os riscos acima sem demandar verba para novas instâncias pagas, adotaremos as seguintes disciplinas de engenharia:

### Diretriz 1: Supabase Local-First (100% Gratuito via Docker)
O fato de não haver verba para duas instâncias na nuvem **não impede** o uso de ambientes separados. Utilizaremos o **Supabase CLI** rodando localmente na máquina de desenvolvimento:
*   **Como funciona:** O desenvolvedor inicia uma instância idêntica do Supabase localmente (`supabase init` -> `supabase start`) usando Docker.
*   **Custo:** Gratuito.
*   **Benefício:** Todo o código, testes de RLS, inserções de fotos e comportamento da galeria são testados localmente. O banco de produção permanece intocado até a homologação final.

### Diretriz 2: Migrações Estritamente Aditivas e Não-Destrutivas (DDL Segura)
A aplicação das alterações no banco de produção seguirá regras rígidas para evitar Locks e quebras:
*   **Novas Tabelas apenas:** A criação de `mural_itens` é uma operação isolada. Por ser uma tabela nova, ela possui custo de Lock zero para as tabelas existentes (`eventos`, `presentes`).
*   **Adições Seguras:** Para a coluna `link_externo` na tabela `presentes`, usaremos a cláusula `ADD COLUMN IF NOT EXISTS text` garantindo compatibilidade com registros passados (valores virão nulos por padrão, sem quebras no front-end atual).
*   **Proibição de `DROP` ou `ALTER` destrutivos:** Fica terminantemente proibido renomear colunas existentes, alterar tipos de dados ativos ou apagar tabelas sem uma estratégia prévia de versionamento de API.

### Diretriz 3: Isolamento por Evento de Teste (Sandbox ID)
*   Para testes que precisem tocar a instância de nuvem (como validação de webhooks de pagamento ou uploads reais de imagem):
*   Criaremos um único registro de evento exclusivo em produção chamado **"Sandbox de Desenvolvimento"** com um `UUID` fixado em ambiente de dev.
*   Todas as consultas, RLS e regras do código local serão filtradas exclusivamente para este ID de evento, garantindo que nenhum teste afete casamentos em andamento.

### Diretriz 4: Backup de Esquema Pré-MIG
Antes de aplicar qualquer migração na instância de produção:
1.  Realizar o dump do esquema atual e dos dados via painel do Supabase.
2.  Agendar a aplicação da migração DDL em horários de baixíssimo acesso (madrugadas entre terça e quarta-feira, minimizando risco de impacto em eventos presenciais que acontecem de sexta a domingo).
