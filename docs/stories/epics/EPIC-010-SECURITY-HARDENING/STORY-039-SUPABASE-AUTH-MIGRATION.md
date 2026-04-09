# STORY-039: Migração para Supabase Auth & Vínculo de Propriedade

## Descrição
Como administrador da plataforma, desejo substituir o sistema de "senha única" por autenticação real via E-mail/Senha (Supabase Auth), vinculando os dados do casamento já configurado à conta criada, para que o sistema seja seguro e escalável.

## Critérios de Aceitação
1. **Login Real:** Substituir a verificação de `ADMIN_PASSWORD` pelo `supabase.auth.signInWithPassword`.
2. **Preservação de Dados:** O casamento existente (ID 1) deve ser associado ao `user_id` do primeiro usuário que se cadastrar/logar.
3. **Persistência de Sessão:** O middleware deve validar o token JWT do Supabase em vez do cookie de texto puro.
4. **Interface de Login:** Atualizar a tela de login para aceitar E-mail e Senha.

## Status: 🚀 Ready (Prioridade Crítica)

## Notas de Implementação
- Adicionar coluna `user_id` na tabela `configuracoes`.
- Implementar fluxo de "Reivindicação de Evento" (Claim) para o primeiro login.
- Atualizar `authService` para usar os métodos oficiais do Supabase.
