# 🏛️ Plano de Arquitetura Refatorado: PRD-012 Consolidado
> **Fase:** ARQUITETURA (@architect) / **Alinhamento Técnico Soboberano**  
> **Status:** AGUARDANDO VALIDAÇÃO DO OPERADOR  
> **Objetivo:** Adaptar a estrutura de banco de dados, endpoints do Daemon e fluxos de trava de estoque de acordo com as definições de UX e Negócio homologadas.

---

## 1. 🗄️ Evolução do Schema do Banco de Dados (Migrations)
Para suportar as novas decisões ("De/Por" em preços e relacionamento da trava com o Convidado), executaremos as seguintes alterações nas tabelas do Supabase:

### A. Tabela `public.presentes` & `public.presentes_base`
*   **Objetivo:** Suportar o gatilho de "desconto" psicológico quando a cura encontrar ofertas mais baratas.
*   **Modificação:** Adicionar a coluna `preco_de` (numeric, nullable).
*   **Regra do Daemon:** Se o `preco_novo` for menor que o `preco_atual`:
    1. Salva `preco_atual` em `preco_de`.
    2. Salva `preco_novo` em `preco`.

### B. Tabela `public.presentes_locks`
*   **Objetivo:** Permitir que os Noivos saibam exatamente qual Convidado acionou a reserva de 3 horas.
*   **Modificação:** Adicionar a coluna `convite_id` (uuid, nullable, FK para `public.convites(id)`).
*   **Regra do Frontend:** Ao clicar no redirecionamento, passamos o ID do convite ativo na sessão para persistir junto ao lock.

---

## 2. 🧠 Refatoração do Motor do Daemon (`/api/intelligence/autonomy/daemon`)
A engine de auto-cura será remodelada para uma substituição integral e inteligente baseada na **Fórmula SAF**.

### Fluxo Técnico Interno:
1.  **Coleta:** Lê itens da fila em `PENDENTE`.
2.  **Processamento Multi-Adaptadores:**
    *   Chama a interface genérica de busca de afiliados (neste momento, `lomadeeService.buscarOfertasEquivalentes(termo, categoria)`).
3.  **Aplicação do Cérebro Matemático (Fórmula SAF):**
    ```typescript
    function calcularSAF(precoOriginal: number, precoNovo: number, comissaoPercent: number): number {
      const comissaoAbsoluta = precoNovo * (comissaoPercent / 100);
      const fatorPreco = Math.pow((precoOriginal / precoNovo), 2);
      return comissaoAbsoluta * fatorPreco;
    }
    ```
4.  **Ordenação:** Aplica `sort((a, b) => b.saf - a.saf)`. Seleciona a melhor oferta (`Top 1`).
5.  **Substituição Definitiva:**
    Atualiza as tabelas `presentes_base` e `presentes` (propagação) com:
    *   `nome` = `oferta.nome_oficial`
    *   `preco` = `oferta.preco_novo`
    *   `preco_de` = `preco_original` (se `preco_novo` < `preco_original`)
    *   `imagem_url` = `oferta.imagem_thumb_url`
    *   `link_externo` = `oferta.link_afiliado_rastreado`
    *   `descricao` = `oferta.detalhes_produto`

---

## 3. 🎁 Experiência no Frontend (Componentes Next.js)

### A. O Card de Presente Misto/Externo (`GiftCard.tsx`)
*   **Visualização Normal:** Se `preco_de` existir e for maior que `preco`, renderiza:
    `<span class="line-through text-gray-400">R$ {preco_de}</span> <span class="text-gold">R$ {preco}</span>`
*   **Sob Trava (Outros Convidados):** O overlay bloqueia clique, exibindo "🔒 Reservado por outro convidado".
*   **Sob Minha Trava:** Exibe botão destacado `[ 🔓 Liberar Minha Reserva ]` para o próprio dono do cookie `session_id`.

### B. O Painel de Admin dos Noivos (`DashboardNoivos.tsx`)
*   **Visualização da Fila de Reservas:** Adição de aba/badge "Reservas Ativas" onde eles veem:
    *   `Nome do Presente`
    *   `Reservado por: [Nome do Convite]`
    *   `Tempo Restante: [HH:MM]`

---

## 📐 Plano de Homologação (Ciclo TDD / E2E)
Antes do DEV escrever código definitivo, o QA ajustará os testes automatizados para garantir:
1.  **Teste 1 (Banco):** Valida que locks criados com `convite_id` trazem o nome do convidado corretamente via `JOIN`.
2.  **Teste 2 (Cálculo SAF):** Fornece 3 ofertas mockadas ao Daemon e assegura matematicamente que o vencedor é o item com maior Score SAF.
3.  **Teste 3 (Substituição Completa):** Garante que rodar o Daemon substitui não apenas o link, mas também imagem, título e preço na base.
4.  **Teste 4 (De/Por):** Garante que a interface exibe o preço antigo cortado quando há redução após auto-cura.

---
**Arquiteto concluiu o mapeamento.** 
Operador, valida esse plano técnico para que eu possa gerar as Migrations no banco e instruir o DEV a codificar? 🫡
