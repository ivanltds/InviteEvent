# Relatório de Segurança - InviteEventAI

#### RESUMO EXECUTIVO
- Total de achados por severidade: 
  - **CRÍTICO:** 1
  - **ALTO:** 1
  - **MÉDIO:** 1
  - **BAIXO:** 1
- Áreas de maior risco: **AUTH / TENANT ISOLATION / DEPS**

#### VULNERABILIDADES CRÍTICAS

**ID SEC-001**
- **Arquivo:** `docs/architecture/supabase-schema.sql` (Linhas 128-132)
- **Descrição:** Políticas de Row Level Security (RLS) configuradas com `FOR ALL USING (true)` para a role `anon`.
- **Impacto no negócio:** Crítico. Qualquer usuário com acesso à chave pública do Supabase (exposta no frontend) pode deletar ou modificar todos os dados de convites, RSVP e presentes de qualquer evento.
- **CVSS:** 9.8
- **Correção:**
```sql
-- Alterar de:
CREATE POLICY "Admin full access convites" ON convites FOR ALL USING (true);
-- Para:
CREATE POLICY "Admin full access convites" ON convites FOR ALL 
USING (auth.role() = 'authenticated');
```

#### VULNERABILIDADES ALTAS

**ID SEC-002**
- **Arquivo:** `.aiox-core\cli\commands\config\index.js` (Linha 435)
- **Descrição:** Path Traversal via entrada de usuário não sanitizada em funções de sistema de arquivos (`path.join`).
- **Impacto no negócio:** Permite que um atacante que tenha acesso ao CLI possa ler ou sobrescrever arquivos sensíveis fora do diretório do projeto.
- **CVSS:** 7.5
- **Correção:**
```javascript
const safePath = path.normalize(userInput).replace(/^(\.\.(\/|\\|$))+/, '');
const targetPath = path.join(baseDir, safePath);
```

#### VULNERABILIDADES MÉDIAS E BAIXAS

**ID SEC-003 (MÉDIO)**
- **Arquivo:** `src/app/api/rsvp/route.ts` (e outros endpoints públicos)
- **Descrição:** Ausência de mecanismos de Rate Limiting.
- **Impacto no negócio:** Exposição a ataques de negação de serviço (DoS) e preenchimento malicioso de formulários (spam de RSVP).
- **CVSS:** 5.3
- **Correção:** Implementar middleware de rate limiting (ex: `@upstash/ratelimit`).

**ID SEC-004 (BAIXO)**
- **Arquivo:** `package.json`
- **Descrição:** Vulnerabilidades detectadas via análise de dependências (npm audit).
- **Impacto no negócio:** Baixo risco de exploração direta no contexto atual, mas aumenta a superfície de ataque.
- **CVSS:** 4.0
- **Correção:** Executar `npm audit fix` e atualizar pacotes para as versões recomendadas.

#### CHECKLIST MANUAL OBRIGATÓRIO
- [x] Toda query ao banco filtra por tenant_id? (Sim, via RLS nas migrations recentes, mas o arquivo de arquitetura inicial está inseguro).
- [x] Webhook PIX valida assinatura antes de confirmar pagamento? (Sim, implementado em `src/app/api/webhooks/stripe/route.ts`).
- [ ] Race condition em duplo clique no pagamento? (Parcialmente mitigado por `FOR UPDATE` na função RPC, mas requer validação em produção).
- [x] CPF/chave PIX aparecem em logs? (Não detectado nos logs de webhook).
- [ ] Endpoints de lista de convidados exigem autenticação? (Não, atualmente `convites` permite SELECT público para viabilizar busca por slug).
- [ ] Presentes podem ter preço alterado via mass assignment? (Sim, se a política RLS `USING(true)` estiver ativa no DB).
- [x] Variáveis de ambiente (.env) estão no .gitignore? (Sim).
