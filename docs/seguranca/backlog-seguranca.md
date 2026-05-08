# Backlog de Segurança

| ID | Título | Severidade | Ferramenta | Arquivo | Status |
|----|--------|------------|------------|---------|--------|
| SEC-001 | RLS permissivo (FOR ALL USING true) | CRÍTICO | Manual/Arch | `docs/architecture/supabase-schema.sql` | ABERTO |
| SEC-002 | Path Traversal no CLI | ALTO | Semgrep | `.aiox-core\cli\commands\config\index.js` | ABERTO |
| SEC-003 | Ausência de Rate Limiting | MÉDIO | Manual | `src/app/api/**/*` | ABERTO |
| SEC-004 | Vulnerabilidades em Dependências | BAIXO | npm audit | `package.json` | ABERTO |
