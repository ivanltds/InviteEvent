# Plano de Implementação — Governança & Privacidade (PRD-013)
> **Orquestração:** @maestro  
> **Fase:** ARQUITETURA (@architect)  
> **Estratégia:** Modular, incremental e pragmática. Sem overengineering.

---

## 📡 1. Banco de Dados e Segurança (Supabase)

### A. Extensão de Esquema (LGPD Audit Trail)
Adicionar campos de auditoria na tabela `rsvp` para registrar consentimento explícito sobre dados de saúde/restrições alimentares.

**Migration SQL (`ddl-lgpd-rsvp.sql`):**
```sql
-- 1. Adicionar colunas na tabela RSVP
ALTER TABLE public.rsvp
ADD COLUMN IF NOT EXISTS lgpd_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lgpd_consent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS lgpd_ip_address text;

-- 2. Criar gatilho para Captura Automática e Segura de IP (Server-Side)
-- O endereço IP é coletado de forma inviolável pelo PostgreSQL ao invés de exposto no frontend
CREATE OR REPLACE FUNCTION public.log_rsvp_client_ip()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lgpd_consent = true THEN
    NEW.lgpd_consent_at := now();
    -- Captura o IP do cliente via conexão ativa do Supabase API
    NEW.lgpd_ip_address := COALESCE(
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      inet_client_addr()::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_rsvp_lgpd_audit
  BEFORE INSERT OR UPDATE ON public.rsvp
  FOR EACH ROW
  EXECUTE FUNCTION public.log_rsvp_client_ip();
```

### B. Hardening RLS (Segurança)
Revisão das políticas RLS na tabela `rsvp` para garantir que usuários anônimos possam ler apenas seus próprios RSVPs (usando o canal anonimizado por token/slug) e que inserções requeiram validação.
- Garantir política de INSERT pública permitida (somente se o convite existir).
- Garantir política de SELECT/UPDATE para o criador do evento restrita a autenticados donos do `evento_id`.

---

## 🧩 2. Componentes Reutilizáveis (UI/React)

### A. Widget de Cookies (`src/components/ui/CookieBanner.tsx`)
*   **Tecnologia:** React (Client Component).
*   **Funcionalidade:**
    *   Renderiza no canto inferior da tela em formato flutuante.
    *   Lê/Salva o estado de aceite no `localStorage` (`invite-event-cookie-consent`).
    *   Implementa **atraso configurável** (`delay` prop). Na Landing Page: `delay={1000}`. Na página de Convite (Digital Envelope): `delay={5000}`.
*   **Design System:** Usa classes adaptativas ou styled classes integrando ao visual Light ou Dark (Glassmorphism).

### B. Modal Overlay Legal (`src/components/ui/LegalOverlay.tsx`)
*   **Funcionalidade:** Modal central que exibe os termos jurídicos completos sem trocar a rota.
*   **Assets:** Importa estaticamente os textos do `termos-de-uso.md` e `politica-privacidade.md` convertidos em strings React ou JSON de constantes legais para otimizar a build Next.js.

---

## 🧪 3. Fluxos Funcionais e Páginas

### A. Formulário de RSVP Condicional (`src/components/sections/RSVP.tsx`)
*   **Detecção Dinâmica:**
    ```typescript
    const hasRestrictions = formData.restricoes.trim().length > 0 || 
      membros.some(m => m.confirmado && m.restricoes && m.restricoes.trim().length > 0);
    ```
*   **Renderização do Checkbox:**
    *   Usar uma `div` com transição suave de CSS (`height`, `opacity`) que só renderiza se `hasRestrictions === true`.
*   **Validação de Form:**
    *   Impedir o submit (`alert` ou `errorMessage`) caso existam restrições e o `lgpdConsentCheckbox` esteja `false`.
*   **Payload:**
    *   Passar `lgpd_consent: true` dentro do payload do `rsvpPayload` enviado ao `rsvpService.submitFullRSVP`.

---

## 🛡️ 4. Qualidade de Código e Redução de Débitos

### A. Tipagem estrita e Mitigação de `any`
*   Atualizar a interface `RSVP` no arquivo `src/lib/types/database.ts` adicionando as propriedades de auditoria.
*   Tipar explicitamente as assinaturas dos novos métodos inseridos no refatoramento do `giftService.ts` para erradicar os `any` no retorno de dados do Dashboard administrativo.

---

## 🏁 5. Cronograma Modular de Entregas (Fase DEV)

1.  **Entrega 1 (Banco & Tipos):** Executar migração SQL e atualizar definições de tipos TypeScript no projeto.
2.  **Entrega 2 (Cookies & Modais):** Construir e plugar o `<CookieBanner />` e o rodapé com `<LegalOverlay />` na Landing Page e no Layout Público dos convites.
3.  **Entrega 3 (Jornada RSVP):** Implementar a validação condicional e o checkbox dinâmico no formulário `RSVP.tsx`.
4.  **Entrega 4 (Validação QA):** Validar a persistência correta de IP no banco de dados e rodar a cobertura de testes automatizados.
