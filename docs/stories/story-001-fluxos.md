# Fluxos de Navegação — PRD 001

Este documento descreve as jornadas do usuário para as principais funcionalidades do MVP Estabilizado.

## 1. Jornada do Convidado: RSVP e Mural

### Fluxo Principal
1. **Entrada:** Convidado recebe link `evento.com/convite/[slug]`.
2. **Landing Page:** Visualiza as boas-vindas dos noivos, contagem regressiva e botão "Confirmar Presença".
3. **Autenticação (Transparente):** O sistema valida o `slug`. Se válido, exibe os nomes dos membros do grupo (ex: Família Silva).
4. **RSVP:**
    - Convidado marca "Confirmado" ou "Não poderei ir" para cada membro.
    - Opcional: Insere restrições alimentares.
    - Clica em "Salvar Confirmação".
5. **Agradecimento & Mural:**
    - Toast de sucesso.
    - Convite para ver a "Lista de Presentes" ou "Mural de Fotos".
6. **Mural de Fotos:**
    - **Visualização:** O convidado vê um grid de fotos enviadas por outros convidados e pelos noivos.
    - **Interação:** Pode clicar em "Curtir" (❤️) nas fotos.
    - **Upload:**
        - Clica na área de upload ou botão "Adicionar Foto".
        - Seleciona um ou mais arquivos de imagem.
        - **Legenda:** Após o upload (ou durante), abre-se um pequeno campo para inserir uma legenda/mensagem opcional.
        - **Submissão:** O sistema envia as fotos para o Cloudinary.
    - **Estado:** Se a moderação estiver ativa, a foto aparece com um selo "Em moderação" apenas para quem enviou, até ser aprovada pelo admin.

## 2. Jornada do Convidado: Presentear

1. **Lista de Presentes:** Convidado acessa a aba "Presentes".
2. **Escolha:** Visualiza grid de itens (Cotas de Lua de Mel e Presentes Físicos simbólicos).
3. **Seleção:** Clica em "Presentear" em um item.
4. **Checkout:**
    - Escolhe método: PIX ou Cartão de Crédito.
    - **PIX:** Exibe QR Code e Chave "Copia e Cola". Aguarda confirmação automática.
    - **Cartão:** Abre modal do Stripe para preenchimento de dados.
5. **Confirmação:** Página de "Obrigado" com mensagem personalizada dos noivos.

## 3. Jornada dos Noivos: Dashboard Administrativo

1. **Login:** Acesso via e-mail/senha no painel admin.
2. **Visão Geral:**
    - Cards com: Total de Convidados, Confirmados, Valor Arrecadado em Presentes.
    - Gráfico de pizza com status do RSVP.
3. **Gestão de Convidados:**
    - Lista de grupos.
    - Botão "Importar CSV" para carga em massa.
    - Busca e filtro por status.
4. **Moderação de Mural:**
    - Aba "Mural".
    - Lista de fotos pendentes de aprovação (ordenadas por data).
    - Ação: "Aprovar" torna a foto pública para todos os convidados.
    - Ação: "Excluir" remove permanentemente do storage e banco.

---
*Documento de referência para o desenvolvimento de rotas e lógica de front-end.*
