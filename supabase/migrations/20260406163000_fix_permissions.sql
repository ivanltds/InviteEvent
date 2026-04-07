-- 1. Garante que a extensão de UUID está ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Permite que o Admin (usando a anon key) possa inserir novos presentes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Inserção pública de presentes') THEN
        CREATE POLICY "Inserção pública de presentes" ON presentes FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Atualização pública de presentes') THEN
        CREATE POLICY "Atualização pública de presentes" ON presentes FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deleção pública de presentes') THEN
        CREATE POLICY "Deleção pública de presentes" ON presentes FOR DELETE USING (true);
    END IF;
END $$;

-- 3. Garante que as permissões foram concedidas aos papéis (roles) do Supabase
GRANT ALL ON TABLE presentes TO anon;
GRANT ALL ON TABLE presentes TO authenticated;
GRANT ALL ON TABLE presentes TO service_role;

GRANT ALL ON TABLE comprovantes TO anon;
GRANT ALL ON TABLE comprovantes TO authenticated;
GRANT ALL ON TABLE comprovantes TO service_role;
