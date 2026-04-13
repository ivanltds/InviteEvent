# STORY-039: Migração para Supabase Auth & Isolamento Multi-Tenant

## Descrição
Como administrador da plataforma, desejo substituir o sistema de "senha única" (embutida no código) por autenticação real via Supabase Auth, vinculando os dados do casamento à conta do proprietário (Owner), garantindo que cada usuário acesse apenas seus próprios eventos e convites.

## Critérios de Aceitação
### 1. Autenticação & Sessão
- **Login Real:** Implementar `signInWithPassword` usando e-mail e senha cadastrados no Supabase.
- **Middleware Protegido:** O acesso a `/admin/*` deve validar a sessão do Supabase (JWT) via Server-side.
- **Logout:** Implementar funcionalidade de encerrar sessão limpando os cookies de auth.

### 2. Vínculo de Propriedade (Migration/Claim)
- **Reivindicação Automática:** Se o evento `id=1` não tiver um `user_id`, o primeiro usuário que logar deve se tornar o `Owner` automático deste evento (para não quebrar o casamento da Layslla e Marcus).
- **Mapeamento de Perfil:** Ao logar, se o perfil não existir na tabela `perfis`, criá-lo automaticamente via trigger no Postgres.

### 3. Isolamento de Dados (RLS)
- **Configurações:** Somente o `Owner` do evento ou um `Master Admin` pode ler/editar a tabela `configuracoes` daquele `evento_id`.
- **Convites e Presentes:** Devem ser filtrados por `evento_id` usando políticas de RLS `USING (evento_id IN (SELECT id FROM eventos WHERE ...))`.

### 4. Interface Admin
- **Tela de Login:** Nova interface de login profissional com campos de e-mail e senha.
- **Feedback de Erro:** Mensagens claras para "E-mail não encontrado" ou "Senha incorreta".

## Status: ✅ DONE 🏆

## Notas de Implementação
- `authService.ts`: Login via `signInWithPassword` + session proxy via `/api/auth/session`
- API Route `/api/auth/session`: Define cookie HTTP-only `sb-access-token`
- Migration `automatic_claim.sql`: Primeiro login vira Owner do evento sem user_id
- Migration `finalize_multi_tenant_rls.sql`: RLS multi-tenant por `evento_id` + `owner_id`
- Login UI funcional em `/admin/login` com suporte a cadastro e login

## Detalhes Técnicos
- **Tabelas Afetadas:** `configuracoes` (adicionar `user_id`), `eventos` (vínculo com `evento_organizadores`), `perfis`.
- **Segurança:** Desativar completamente a variável `NEXT_PUBLIC_ADMIN_PASSWORD` após a homologação desta US.

