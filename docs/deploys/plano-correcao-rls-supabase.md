# Plano de Implantação de Segurança: Correção de RLS Supabase

## 1. Diagnóstico de Vulnerabilidade
Após análise das migrações do projeto e inspeção das políticas de segurança, identificou-se que o Row Level Security (RLS), embora ativo (`ENABLE ROW LEVEL SECURITY`), está sendo sistematicamente ignorado por políticas permissivas demais.

### Problemas Encontrados:
- **Políticas "Admin full access":** Diversas tabelas (`convites`, `rsvp`, `presentes`, `comprovantes`, `faq`, `convite_membros`, `eventos_agenda`, `galeria_albuns`, `galeria_fotos`, `mural_mensagens`) possuem políticas `FOR ALL USING (true)`. Isso permite que qualquer usuário (incluindo anônimos) execute INSERT, UPDATE e DELETE em qualquer registro.
- **Grants Excessivos:** Foi concedido `GRANT ALL` em todas as tabelas para os papéis `anon` e `authenticated`. Em um ambiente Supabase, o ideal é que `anon` tenha apenas permissões mínimas (SELECT em tabelas públicas e INSERT em tabelas de coleta de dados como RSVP).
- **Falta de Isolamento de Tenant:** Não há validação consistente se o usuário que tenta alterar um registro é de fato o organizador do evento (`evento_id`) associado àquele registro.

## 2. Script SQL de Correção (Sugestão)

```sql
-- Início da correção de segurança
BEGIN;

-- 1. LIMPEZA DE POLÍTICAS INSEGURAS
-- Função auxiliar para remover políticas "Admin" ou permissivas demais
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (policyname LIKE 'Admin full access%' 
             OR policyname LIKE 'Inserção pública%' 
             OR policyname LIKE 'Atualização pública%'
             OR policyname LIKE 'Deleção pública%'
             OR policyname = 'Leitura pública de convites'
             OR policyname = 'Leitura pública de configs')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. AJUSTE DE GRANTS (Princípio do Privilégio Mínimo)
-- Revogar ALL e conceder apenas o necessário
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Permissões padrão para tabelas públicas (Leitura)
GRANT SELECT ON eventos, configuracoes, presentes, faq, eventos_agenda, galeria_albuns, galeria_fotos TO anon, authenticated;

-- Permissões para operações de convidados
GRANT INSERT, SELECT, UPDATE ON rsvp TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE ON convite_membros TO anon, authenticated;
GRANT INSERT ON comprovantes, mural_mensagens TO anon, authenticated;
GRANT SELECT ON mural_mensagens TO anon, authenticated;

-- 3. NOVAS POLÍTICAS DE RLS (Tenant-Aware)

-- Auxiliar: Função para verificar se usuário é organizador do evento
-- (Assume-se que evento_id está presente nas tabelas)

-- EVENTOS
CREATE POLICY "Eventos: Público vê apenas ativos via slug" ON eventos
    FOR SELECT USING (ativa = true);
CREATE POLICY "Eventos: Organizadores full access" ON eventos
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND is_master = true)
    );

-- CONFIGURACOES
CREATE POLICY "Config: Público vê via evento_id" ON configuracoes
    FOR SELECT USING (true);
CREATE POLICY "Config: Organizadores full access" ON configuracoes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = configuracoes.evento_id AND user_id = auth.uid())
    );

-- PRESENTES
CREATE POLICY "Presentes: Público vê via evento_id" ON presentes
    FOR SELECT USING (true);
CREATE POLICY "Presentes: Organizadores full access" ON presentes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = presentes.evento_id AND user_id = auth.uid())
    );

-- RSVP e MEMBROS (Permite convidados preencherem, mas não verem de outros eventos)
CREATE POLICY "RSVP: Convidados inserem e veem seu próprio" ON rsvp
    FOR INSERT WITH CHECK (true);
CREATE POLICY "RSVP: Ver e Atualizar via ID" ON rsvp
    FOR SELECT USING (true); -- Geralmente filtrado por ID/Token no código
CREATE POLICY "RSVP: Organizadores full access" ON rsvp
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = rsvp.evento_id AND user_id = auth.uid())
    );

-- MURAL E COMPROVANTES
CREATE POLICY "Mural: Público vê e posta" ON mural_mensagens
    FOR SELECT USING (aprovada = true);
CREATE POLICY "Mural: Inserção pública" ON mural_mensagens
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Mural: Organizadores gerenciam" ON mural_mensagens
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = mural_mensagens.evento_id AND user_id = auth.uid())
    );

COMMIT;
```

## 3. Passo a Passo da Aplicação

1.  **Backup de Segurança:** Realizar um Snapshot manual do banco de dados no dashboard do Supabase.
2.  **Ambiente de Homologação:** Aplicar o script primeiro em uma branch de staging/dev.
3.  **Execução em Produção:**
    - Acessar o SQL Editor do Supabase.
    - Colar o script de correção.
    - Executar dentro de uma transação (`BEGIN/COMMIT`).
4.  **Teste de Sanidade (Smoke Test):**
    - **Cenário A (Anônimo):** Tentar deletar um presente via API/Console (Deve dar 403/Forbidden).
    - **Cenário B (Anônimo):** Tentar ler configurações de um evento (Deve dar 200/OK).
    - **Cenário C (Organizador):** Criar/Editar item no seu próprio evento (Deve dar 200/OK).
    - **Cenário D (Cross-Tenant):** Organizador A tentando editar Presente do Evento B (Deve falhar).

## 4. Plano de Rollback

Caso ocorram erros de permissão inesperados no app (ex: convidados não conseguindo fazer RSVP):
1.  Executar o script de rollback (reaplicando as políticas de "Admin full access" temporariamente ou restaurando o Snapshot de backup).
2.  Analisar logs do PostgREST no Supabase para identificar qual política barrou a requisição legítima.

---
**Responsável:** DevOps Agent
**Status:** Aguardando Validação do Operador
**Data:** 15/04/2024
