import { test, expect } from '@playwright/test';

// Estes testes focam em regras de negócio de autenticação e DEVEM ignorar o storageState global
// para simular usuários novos ou não logados.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Autenticação e Segurança - Regras de Negócio', () => {
  const password = 'TestPassword123!';

  // Este teste é instável devido às políticas de proteção contra enumeração do Supabase
  // que podem retornar 'sucesso' mesmo em conflito para evitar vazamento de e-mails.
  test.skip('Deve bloquear cadastro com e-mail já existente', async ({ page }) => {
    test.slow(); // Regras de Auth envolvem redirects duplos e rate limits

    // IMPORTANTE: Máxima entropia para evitar colisões persistentes
    // Usamos @conflict.com para que o LoginPage NÃO tente auto-login (STORY-LOG-049)
    const uniqueEmail = `conflict-v10-${Date.now()}-${Math.floor(Math.random() * 100000)}@conflict.com`;
    
    // Pequeno delay para acalmar o Rate Limit do Supabase
    await page.waitForTimeout(2000);

    // 1. Primeiro cadastro (Sucesso)
    await page.goto('/admin/login');
    await page.getByText('Não tem conta? Criar agora').click();
    await page.getByPlaceholder('Nome completo').fill('Primeiro User');
    await page.getByPlaceholder('CPF').first().fill('11122233344');
    await page.getByPlaceholder('Telefone').first().fill('11999999999');
    await page.getByPlaceholder('E-mail').fill(uniqueEmail);
    await page.getByPlaceholder('Senha').fill(password);
    
    await Promise.all([
      page.waitForURL(/.*dashboard.*/, { timeout: 60000 }),
      page.getByRole('button', { name: 'Cadastrar' }).click()
    ]);

    // 2. Logout completo
    page.on('dialog', d => d.accept());
    await page.getByText('Sair da Conta').click();
    await expect(page).toHaveURL(/.*login.*/);

    // 3. Tentar cadastrar o MESMO e-mail
    await page.getByText('Não tem conta? Criar agora').click();
    await page.getByPlaceholder('Nome completo').fill('Segundo User');
    await page.getByPlaceholder('CPF').first().fill('55566677788');
    await page.getByPlaceholder('Telefone').first().fill('11988887777');
    await page.getByPlaceholder('E-mail').fill(uniqueEmail);
    await page.getByPlaceholder('Senha').fill(password);
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    // 4. Verificar erro de duplicidade
    const errorMsg = page.locator('[class*="error"], .error');
    await expect(errorMsg).toBeVisible({ timeout: 15000 });
    await expect(errorMsg).toContainText(/already registered|já cadastrado|já existe/i);
  });

  test('Deve redirecionar para login ao acessar dashboard sem sessão', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/.*login.*/);
  });
});
