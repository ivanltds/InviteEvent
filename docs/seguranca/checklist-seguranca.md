# Checklist de Segurança - Ações Corretivas

Abaixo estão as ações sugeridas para mitigar os riscos encontrados, ordenadas por prioridade.

## Prioridade 1: CRÍTICO (Imediato)
- [ ] **Corrigir Políticas RLS:** Revisar `docs/architecture/supabase-schema.sql` e aplicar no banco de dados. 
    - Remover `FOR ALL USING (true)` da role `anon`.
    - Restringir `UPDATE` e `DELETE` para usuários autenticados (Admin).
    - Exemplo: `CREATE POLICY "Admins can update" ON convites FOR UPDATE TO authenticated USING (auth.uid() = 'ID_DO_ADMIN');`
- [ ] **Remover GRANT ALL:** Restringir permissões de tabela no Supabase. `anon` não deve ter `ALL` nas tabelas.

## Prioridade 2: IMPORTANTE (Próxima Sprint)
- [ ] **Implementar Rate Limiting:** Adicionar proteção contra spam nos endpoints de `/api/rsvp` e `/api/convites`.
- [ ] **Sanitização de Path (CLI):** Se o `.aiox-core` for distribuído, sanitizar entradas de path em `cli/commands/config/index.js`.
- [ ] **Validar Payload de RSVP:** Garantir que o número de `confirmados` não exceda o `limite_pessoas` do convite no nível da API/Banco (não apenas no frontend).

## Prioridade 3: NICE TO HAVE
- [ ] **Logging de Auditoria:** Implementar logs de alterações em tabelas sensíveis (logs de quem alterou o quê).
- [ ] **Monitoramento de Erros:** Substituir o fail-silent do proxy do Supabase por um sistema de reporte de erros (ex: Sentry) em produção.
- [ ] **Revisão de Dependências:** Rodar `npm audit fix` para tratar vulnerabilidades conhecidas em pacotes npm.
