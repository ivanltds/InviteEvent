# Automação de Banco de Dados Supabase (CI/CD & DevOps)

Este documento define a infraestrutura e as configurações necessárias para permitir que o Agente DevOps realize alterações de banco de dados, backups e correções de RLS de forma 100% automatizada.

## 1. Diagnóstico de Falhas Anteriores

### 1.1. Erro: "Tenant not found"
Este erro ocorre quando tentamos conectar ao pooler do Supabase (**Supavisor**, porta `6543`) usando apenas o usuário `postgres`.
- **Causa:** O pooler exige que o usuário seja identificado pelo ID do projeto: `postgres.[ID-DO-PROJETO]`.
- **Limitação:** Mesmo com o usuário correto, a porta `6543` opera geralmente em *Transaction Mode*, que pode falhar ao executar comandos de DDL (como `CREATE POLICY` ou `ALTER TABLE`) que exigem uma sessão persistente.

### 1.2. Erro: "pg_dump not found"
O ambiente de execução (Vercel ou Runner local) não possui os binários do PostgreSQL instalados nativamente.
- **Causa:** Scripts que dependem de comandos do sistema (`pg_dump`, `psql`) falham se o pacote `postgresql-client` não estiver presente no PATH.

## 2. Padrão de Conexão Recomendado

Para automação via scripts Node.js ou CLI:

| Tipo de Operação | Host Recomendado | Porta | Modo |
|------------------|------------------|-------|------|
| **Migrações / DDL** | `db.[ID].supabase.co` | `5432` | Direto (Session) |
| **Backups (pg_dump)** | `db.[ID].supabase.co` | `5432` | Direto (Session) |
| **Aplicação (Runtime)**| `[ID].pooler.supabase.com`| `6543` | Pooler (Transaction) |

## 3. Requisitos de Configuração (Checklist)

Para destravar a automação total, o Operador deve fornecer/configurar:

1.  **Supabase Access Token:**
    - Gerar em: [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
    - Adicionar ao `.env` como `SUPABASE_ACCESS_TOKEN`.
2.  **ID do Projeto:**
    - Identificado como: `runyitdsxlctoahikkxe`
3.  **Senha do Banco de Dados:**
    - Definir/Resetar no painel e atualizar `DATABASE_URL` no `.env`.
4.  **Instalação do Supabase CLI:**
    - O ambiente de CI deve rodar `npm install -g supabase` ou usar a action oficial.

## 4. Fluxo de Trabalho Automatizado

### 4.1. Realizando Backups antes de alterações
O Agente DevOps executará:
```bash
supabase db dump --db-url "$DATABASE_URL" -f backup.sql
```

### 4.2. Aplicando Migrações
As migrações devem ser colocadas em `supabase/migrations/` e aplicadas via:
```bash
supabase db push
```

### 4.3. Correção de RLS (Hotfix)
Para correções urgentes via script, usaremos a conexão direta (porta 5432) para evitar limites do pooler:
```javascript
// Exemplo de string de conexão direta
const directUrl = "postgresql://postgres.[ID]:[SENHA]@db.[ID].supabase.co:5432/postgres";
```

## 5. Próximos Passos

1.  **Operador:** Configurar `SUPABASE_ACCESS_TOKEN` no ambiente.
2.  **DevOps:** Implementar script `scripts/backup-db.js` que utiliza o CLI ou `pg_dump`.
3.  **DevOps:** Padronizar todos os scripts em `scripts/` para converter automaticamente a porta `6543` para `5432` durante operações administrativas.

---
**Status:** 🟡 Aguardando Token de Acesso
**Responsável:** DevOps Agent
