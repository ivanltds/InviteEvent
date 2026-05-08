# PRD 001 — Consolidação MVP e Estabilização (Refinado)

## 1. Visão Geral
Este documento detalha os requisitos funcionais e técnicos para a consolidação do MVP do **InviteEventAI**. O foco é resolver débitos técnicos críticos de segurança, estabilizar as funcionalidades existentes e adicionar recursos de engajamento (Mural) e gestão (Importação/Presentes).

## 2. Personas
- **Os Noivos (Admin):** Organizadores do evento que precisam gerenciar a lista, ver estatísticas e controlar a arrecadação de presentes.
- **O Convidado:** Pessoa que interage com o convite digital, confirma presença, visualiza informações e presenteia os noivos.

## 3. Histórias de Usuário (Detalhadas)

### 3.1. Fluxo de RSVP e Segurança (CRÍTICO)

**US01 — Acesso Seguro ao Convite**
- **Como** Convidado,
- **Quero** acessar meu convite através de um link único (slug) ou busca restrita,
- **Para que** meus dados de acompanhantes e escolhas não fiquem expostos publicamente.
- **Critérios de Aceite:**
  - O sistema deve usar o `slug` do convite como identificador único na URL.
  - A busca por nome na página inicial não deve listar todos os convidados; deve exigir um "match" claro para exibir o convite.
  - As políticas de RLS (Row Level Security) do Supabase devem ser configuradas para que `SELECT` em `rsvp` e `convite_membros` só retorne dados se o `slug` da sessão corresponder.
  - Impede-se a enumeração de IDs (IDOR) trocando IDs sequenciais por UUIDs ou validando o acesso via token/slug.

**US02 — Confirmação de Presença (RSVP)**
- **Como** Convidado,
- **Quero** confirmar ou declinar minha presença e a dos meus familiares vinculados,
- **Para que** os noivos tenham a contagem exata de pessoas.
- **Critérios de Aceite:**
  - Listagem clara de todos os membros do grupo do convite.
  - Botão de alternância (Check/Radio) para "Confirmado" ou "Não poderei ir" por pessoa.
  - Campo opcional para "Observações/Alergias Alimentares".
  - Validação de data limite para RSVP (se configurado pelos noivos).
  - Feedback visual imediato (Toast) após a confirmação.

### 3.2. Mural de Fotos e Mensagens (IMPORTANTE)

**US03 — Upload de Fotos**
- **Como** Convidado,
- **Quero** fazer o upload de fotos tiradas durante o evento ou ensaio,
- **Para que** eu possa compartilhar esses momentos no site dos noivos.
- **Critérios de Aceite:**
  - Interface simples de "Click to Upload" ou "Drag & Drop".
  - Suporte a múltiplos arquivos simultâneos.
  - Integração com Cloudinary para redimensionamento automático e armazenamento.
  - Exibição em formato de galeria (Masonry ou Grid) com visualizador de imagem (Lightbox).

**US04 — Moderação de Mural (Admin)**
- **Como** Noivo/Admin,
- **Quero** aprovar ou excluir fotos enviadas pelos convidados,
- **Para que** o mural mantenha a harmonia e o respeito.
- **Critérios de Aceite:**
  - Aba de gerenciamento no painel administrativo.
  - Ação rápida para "Ocultar" ou "Excluir" foto.
  - Opção de "Aprovação Automática" (Toggle).

### 3.3. Gestão de Presentes e Cotas (IMPORTANTE)

**US05 — Lista de Presentes e Cotas de Lua de Mel**
- **Como** Convidado,
- **Quero** escolher um item da lista ou contribuir com uma cota de valor pré-definido,
- **Para que** eu possa presentear os noivos de forma prática.
- **Critérios de Aceite:**
  - Exibição de itens com imagem, descrição e valor.
  - Itens podem ser marcados como "Já Presenteado" (Bloqueado).
  - Integração com PIX (exibição de chave ou QR Code dinâmico).
  - Integração com Checkout Stripe para cartões de crédito.
  - Envio de e-mail de agradecimento automático após confirmação de pagamento (webhook).

### 3.4. Administração e Produtividade (IMPORTANTE)

**US06 — Importação de Lista em Massa**
- **Como** Noivo/Admin,
- **Quero** subir um arquivo CSV ou Excel com os nomes dos convidados,
- **Para que** eu não precise cadastrar centenas de pessoas manualmente.
- **Critérios de Aceite:**
  - Botão de "Importar" no dashboard.
  - Template para download.
  - Mapeamento de colunas: Nome, E-mail (opcional), Telefone (opcional), Grupo/Família.
  - Tratamento de erros: Linhas duplicadas ou formato inválido devem ser reportados.

## 4. Requisitos Não Funcionais (Prioritários)

- **Desempenho (Performance):** O carregamento da página de convite não deve ultrapassar 2 segundos (LCP).
- **Segurança (Security):** Zero vazamento de dados via API Pública (Supabase). Auditoria de RLS completa.
- **Usabilidade (UX):** Interface "Mobile-First", visto que a maioria dos convidados acessará via celular/WhatsApp.
- **Consistência de Dados:** Uso de Transações (ou RPCs no Postgres) para garantir que o RSVP de múltiplos membros seja salvo como uma unidade atômica.

## 5. Regras de Negócio
1. O convidado só pode visualizar o mural e a lista de presentes se o convite estiver ativo.
2. Uma cota de lua de mel pode receber múltiplos contribuintes, ao contrário de um presente físico (ex: "Geladeira") que deve ser único.
3. O Dashboard do admin deve refletir as estatísticas de RSVP em tempo real (via Realtime do Supabase ou revalidação de cache).

## 6. Próximos Passos (Workflow)
1. **UX/UI:** Criação dos wireframes para o Mural de Fotos e o novo fluxo de RSVP seguro.
2. **Arquitetura:** Definição do esquema de banco de dados para `mural_fotos` e refinamento das policies de RLS.
3. **Desenvolvimento:** Sprint de estabilização (RLS + Countdown) seguida pela Sprint de Funcionalidades (Mural + Importação).

---
*Documento refinado pelo BA Senior para a fase de Descoberta.*
