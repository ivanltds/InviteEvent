# Guia de Configuração dos Templates de E-mail (Celebre)

Este documento contém o passo a passo para configurar os e-mails transacionais da plataforma **Celebre** no Supabase, garantindo que os usuários recebam comunicações com a identidade visual da marca (cores champagne/dourado `#D4AF37`, fontes elegantes e botões responsivos).

---

## Onde encontrar os arquivos HTML

Os arquivos HTML completos e prontos com CSS inline estão localizados em:
- **Confirmação de Conta:** [`supabase/templates/confirm-signup.html`](file:///c:/Users/ivanl/OneDrive/Documents/projetos/invite-event/supabase/templates/confirm-signup.html)
- **Recuperação de Senha:** [`supabase/templates/reset-password.html`](file:///c:/Users/ivanl/OneDrive/Documents/projetos/invite-event/supabase/templates/reset-password.html)
- **Convite de Co-Proprietário / Equipe:** [`supabase/templates/team-invite.html`](file:///c:/Users/ivanl/OneDrive/Documents/projetos/invite-event/supabase/templates/team-invite.html)
- **Layout Base / Molde:** [`supabase/templates/base-layout.html`](file:///c:/Users/ivanl/OneDrive/Documents/projetos/invite-event/supabase/templates/base-layout.html)

---

## Como Aplicar no Supabase Dashboard (Produção)

1. Acesse o painel do [Supabase Dashboard](https://supabase.com/dashboard) e entre no projeto de produção da Celebre.
2. No menu lateral esquerdo, vá em **Authentication** e clique em **Email Templates**.
3. Atualize cada um dos três templates conforme abaixo:

---

### 1. Confirmação de Cadastro (`Confirm signup`)
- **Subject (Assunto):** `Confirme seu e-mail no Celebre ✨`
- **Body (Corpo):**
  - Abra o arquivo [`supabase/templates/confirm-signup.html`](file:///c:/Users/ivanl/OneDrive/Documents/projetos/invite-event/supabase/templates/confirm-signup.html).
  - Copie todo o conteúdo e cole no campo de código do Supabase.
  - Clique em **Save Changes**.

---

### 2. Recuperação de Senha (`Reset Password`)
- **Subject (Assunto):** `Redefinição de senha — Celebre 🔒`
- **Body (Corpo):**
  - Abra o arquivo [`supabase/templates/reset-password.html`](file:///c:/Users/ivanl/OneDrive/Documents/projetos/invite-event/supabase/templates/reset-password.html).
  - Copie todo o conteúdo e cole no campo de código do Supabase.
  - Clique em **Save Changes**.

---

### 3. Convite de Usuário / Co-Proprietário (`Invite user`)
- **Subject (Assunto):** `Você foi convidado(a) para gerenciar o casamento no Celebre 👑`
- **Body (Corpo):**
  - Abra o arquivo [`supabase/templates/team-invite.html`](file:///c:/Users/ivanl/OneDrive/Documents/projetos/invite-event/supabase/templates/team-invite.html).
  - Copie todo o conteúdo e cole no campo de código do Supabase.
  - Clique em **Save Changes**.

---

## Variáveis do Supabase Auth Suportadas

Os templates foram construídos utilizando as variáveis oficiais do Supabase Auth:
- `{{ .ConfirmationURL }}`: Link seguro único gerado pelo Supabase com token de autenticação.
- `{{ .SiteURL }}`: Domínio base da aplicação (configurado em *URL Configuration*).
- `{{ .Email }}`: Endereço de e-mail do destinatário.

---

## Checklist de Validação

- [ ] Copiado `confirm-signup.html` para *Confirm signup* no Supabase
- [ ] Copiado `reset-password.html` para *Reset Password* no Supabase
- [ ] Copiado `team-invite.html` para *Invite user* no Supabase
- [ ] Teste real de solicitação de redefinição de senha em `/admin/recuperar-senha`
- [ ] Verificação da caixa de entrada: logo Celebre visível, botão dourado clicável e redirecionamento correto para `/admin/redefinir-senha`
