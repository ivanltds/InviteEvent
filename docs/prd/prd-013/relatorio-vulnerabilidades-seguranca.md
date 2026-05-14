# Relatório de Vulnerabilidades e Auditoria de Segurança (PRD-013)

Este documento apresenta a auditoria de segurança nas dependências externas e pontos de entrada de rede executados na fase PRD-013 do ecossistema **InviteEventAI**.

---

## 1. Resumo da Auditoria de Dependências (`npm audit`)

Rodado em 14 de maio de 2026 às 20:58 BRT.

| Severidade | Total Encontrado | Risco de Exploração | Status da Ação |
| --- | --- | --- | --- |
| **Crítica** | 0 | Nulo | ✅ Seguro |
| **Alta** | 0 | Nulo | ✅ Seguro |
| **Média** | 2 | Baixo (ambiente interno) | 📝 Acompanhamento |
| **Baixa** | 0 | Nulo | ✅ Seguro |

---

## 2. Detalhamento do Achado (SEC-013-A)

### 📦 Vulnerabilidade na Biblioteca `postcss`

*   **Impacto**: Moderate (Severidade Média).
*   **Causa**: Cross-Site Scripting (XSS) via Unescaped `</style>` em seu motor de CSS Stringify Output.
*   **Rota de Entrada**: `postcss` é uma dependência direta da framework fundamental do Next.js em uso.
*   **Desafio de Resolução**: O comando recomendado pelo npm (`npm audit fix --force`) forçaria um rebaixamento destrutivo para a versão `next@9.3.3`, o que quebraria completamente o App Router moderno e a infraestrutura Vercel.
*   **Mitigação Adotada**: 
    *   Mantivemos o pacote sem downgrades disruptivos.
    *   O Next.js executa a compilação de CSS estritamente no lado do servidor durante a fase de build (sem inputs de CSS dinâmicos fornecidos por usuários).
    *   **Decisão**: Risco Aceito (Aceitação Formal do Risco Técnico), monitorando atualizações diretas de pacotes no canal Next.js 14 LTS.

---

## 3. Auditoria de Controle de Acesso e Back-end

### 🛡️ Isolamento Multi-Tenant (Row Level Security)
Avaliamos as tabelas do Supabase para garantir isolamento total de dados de diferentes casamentos:

1.  **Tabela `presentes`**: ✅ Remediado. Anteriormente vulnerável a SELECT público sem filtros, agora o select exige a correspondência com `evento_id` e restrição de status para anônimos.
2.  **Tabela `convites`**: ✅ Remediado. Acesso público autorizado apenas via Slug (indireto, 1-para-1), com mutações (RSVP) seguras através de transações com chaves únicas.
3.  **Tabela `configuracoes`**: ✅ Protegido. Somente as colunas públicas (`pix_banco`, `pix_chave`, `accent_color`) são exportadas; dados de cobrança SaaS ficam retidos no backend seguro.

### 🛠️ Recomendações Adicionais de Segurança
1.  **Rate Limiting**: Introduzir um limiar de 10 requisições por minuto para criação de novos RSVPs por IP para mitigar abusos automatizados.
2.  **CSP (Content Security Policy)**: Adicionar cabeçalhos CSP rígidos para garantir que scripts de terceiros não autorizados não acessem comprovantes de PIX inseridos no Cloudinary.
