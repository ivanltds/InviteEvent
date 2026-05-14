# Relatório de Conformidade LGPD (PRD-013)

Este documento apresenta a estratégia de governança de dados pessoais e conformidade com a **Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)** da plataforma **InviteEventAI**.

---

## 1. Mapeamento de Dados Pessoais (PII)

A plataforma coleta e processa as seguintes categorias de dados para a operação dos convites digitais e RSVP:

| Dado Coletado | Categoria de Titular | Finalidade do Tratamento | Base Legal (Art. 7º) |
| --- | --- | --- | --- |
| **Nome do Convidado** | Convidado do Casamento | Identificação no evento e controle de lista de presença. | Execução de Contrato / Legítimo Interesse |
| **Restrições Alimentares** | Convidado do Casamento | Planejamento de buffet pelo casal (saúde do convidado). | **Dado Sensível**: Consentimento Explícito |
| **Comprovantes de PIX** | Convidado Pagador | Confirmação de liberação de presente virtual (repassado ao casal). | Execução de Contrato |
| **Chave PIX / Telefone** | Organizador (Casal) | Recebimento direto dos presentes virtuais. | Execução de Contrato |
| **E-mail e Credenciais** | Organizador (Casal) | Autenticação na console administrativa. | Execução de Contrato |

---

## 2. Ciclo de Vida do Dado e Direitos dos Titulares

### A. Armazenamento e Retenção
Os dados pessoais residem na nuvem do Supabase em datacenters seguros com criptografia em trânsito (TLS 1.3) e em repouso (AES-256). 
*   **Período de Retenção**: Os dados são mantidos por até 90 dias após a data de realização do casamento, garantindo que o casal exporte seus relatórios de presentes e RSVPs. Após esse ciclo, os dados podem ser arquivados anonimizados para fins analíticos de BI.

### B. Direitos do Convidado (Titular)
Em conformidade com o Artigo 18 da LGPD, o InviteEventAI garante:
1.  **Confirmação e Acesso**: O titular pode visualizar sua resposta do RSVP acessando novamente o link exclusivo do convite.
2.  **Correção**: O convidado pode reajustar a resposta até o prazo final estipulado pelo organizador no painel.
3.  **Eliminação**: Convidados podem solicitar ao organizador (Controlador do Dado) a exclusão do seu nome da lista, executada via console administrativa (ação "Excluir Convidado" que limpa as chaves em cascata no DB).

---

## 3. Papéis no Tratamento de Dados

*   **Controlador dos Dados**: Os Noivos/Organizadores do Casamento. Eles determinam quem é inserido na lista, quais presentes sugerir e possuem controle final de manipulação de dados no dashboard.
*   **Operador dos Dados**: Plataforma InviteEventAI (e sub-processadores como Supabase, Cloudinary, Vercel). Processa os dados estritamente para manter o app operacional de acordo com as configurações do controlador.

---

## 4. Medidas de Segurança Adotadas

1.  **Minimização**: Coletamos estritamente o necessário para o RSVP. Não exigimos CPF, RG ou endereço físico dos convidados do casamento.
2.  **Isolamento de Dados (RLS)**: Políticas de nível de linha impedem que um casal (ou atacante externo) acesse dados de convidados de outros casamentos.
3.  **Ofuscação de URLs**: Os convites geram slugs randômicos com hashes hexadecimais (`nome-do-convidado-a3b2`), prevenindo raspagem sequencial automatizada da lista de presença na internet pública.
4.  **Eliminação de Comprovantes**: Os arquivos de comprovantes de pagamento PIX residem no bucket seguro e possuem identificadores não sequenciais.

---

## 5. Recomendações Legais e Roadmap de Privacidade
1.  **Termos de Uso / Política de Privacidade**: Adicionar rodapé estático na home page e nos convites públicos com link para a Política de Privacidade do ecossistema.
2.  **Consentimento de Dados Sensíveis**: Incluir uma caixa de marcação explicativa no formulário de restrições alimentares ("_Autorizo o tratamento das minhas informações de saúde/alergia exclusivamente para planejamento do cardápio_").
