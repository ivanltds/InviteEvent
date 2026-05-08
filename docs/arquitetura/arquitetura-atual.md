# Arquitetura Atual — InviteEventAI

## Visão Geral
A plataforma InviteEventAI é um sistema SaaS multi-tenant para gestão de eventos (foco inicial em casamentos). Utiliza uma arquitetura baseada em Next.js 16/React 19 com persistência e segurança providas pelo Supabase.

## Componentes
- **Next.js App Router**: Organizado em grupos de rotas:
  - `(public)`: Páginas de convite, presentes e RSVP acessíveis via slug.
  - `(admin)`: Painel de controle para organizadores, protegido por autenticação.
- **Supabase**: 
  - **Auth**: Gestão de usuários e perfis.
  - **Database**: PostgreSQL com RLS para isolamento de dados por `evento_id`.
  - **Storage**: Armazenamento de fotos de noivos, galeria e comprovantes.
  - **RPC**: Funções em PL/pgSQL para operações atômicas (ex: reserva de presentes).

## Fluxos Principais
1. **Onboarding**: Usuário cria conta -> Cria evento -> Configura detalhes básicos -> Link público gerado.
2. **Convite e RSVP Seguro**: Convidado acessa `/inv/[slug]` -> Valida acesso -> Visualiza detalhes -> Confirma presença -> Dados salvos em `rsvp` e `convite_membros` via UUID.
3. **Mural de Fotos**: Convidado faz upload de foto -> Foto entra em moderação (opcional) -> Exibição na galeria com reações.
4. **Lista de Presentes (PIX Direto)**: Convidado escolhe presente/cota -> Visualiza QR Code/Chave PIX -> Realiza pagamento -> Notifica sistema (pendente de aprovação admin).

## Dependências Externas
- **Stripe**: Processamento de pagamentos para ativação do site e presentes (opcional).
- **Cloudinary**: Otimização e entrega de imagens (opcional, pode usar Supabase Storage).
- **Vercel**: Hospedagem e Edge Runtime.

## Modelo de Dados (Entidades Principais)

### Núcleo do Evento
- `eventos`: Cabeçalho do evento (id, nome, slug, status).
- `perfis`: Dados estendidos do usuário (is_master, etc).
- `evento_organizadores`: Tabela de ligação entre usuários e eventos (roles: owner, organizador).

### Gestão de Convidados
- `convites`: Grupos de convidados vinculados a um evento (ID UUID).
- `convite_membros`: Membros individuais dentro de um convite.
- `rsvp`: Respostas de confirmação vinculadas ao membro.

### Engajamento (Mural)
- `mural_fotos`: Fotos enviadas por convidados (id, event_id, url, legenda, status_moderacao).
- `mural_reactions`: Reações (likes) nas fotos do mural.

### Financeiro (Presentes)
- `presentes`: Itens da lista (nome, valor, categoria, quantidade, estoque).
- `transacoes_presentes`: Registro de intenções de presente e pagamentos (pix/stripe).

## Decisões Arquiteturais
- **Multi-tenancy via RLS**: Uso obrigatório de `evento_id` em todas as tabelas transacionais para isolamento.
- **UUID vs Serial**: Migração total para UUIDs em chaves primárias e estrangeiras para evitar IDOR (Insecure Direct Object Reference).
- **Moderação Assíncrona**: Fotos do mural nascem com `is_approved = false` por padrão se configurado pelo noivo.
- **PIX Direto**: Foco inicial em facilitação de transferência direta (QR Code estático) para evitar taxas de intermediários para os noivos.

## Riscos Técnicos
- **Segurança de Storage**: Necessidade de políticas de RLS rigorosas nos buckets de armazenamento para evitar deleção não autorizada.
- **Concorrência em Cotas**: Garantir que a reserva de cotas de presentes seja atômica via RPC.

## Dívidas Técnicas
- Implementação de Webhooks para confirmação automática de PIX (atualmente manual).
- Otimização de imagens no cliente antes do upload para economizar storage.
