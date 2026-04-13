import { test, expect } from '@playwright/test';

// Estes testes focam em regras de negócio de autenticação e DEVEM ignorar o storageState global
// para simular usuários novos ou não logados.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Autenticação e Segurança - Regras de Negócio', () => {
  const password = 'TestPassword123!';

  test('Deve bloquear cadastro com e-mail já existente', async ({ page }) => {
    // IMPORTANTE: Definir o email DENTRO do teste para que retentativas usem emails diferentes
    const uniqueEmail = `conflict-v4-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.com`;
    
    // 1. Primeiro cadastro (Sucesso)
    await page.goto('/admin/login');
    await page.getByText('Não tem conta? Criar agora').click();
    await page.getByPlaceholder('Nome completo').fill('Primeiro User');
    await page.getByPlaceholder('CPF').first().fill('11122233344');
    await page.getByPlaceholder('Telefone').first().fill('11999999999');
    await page.getByPlaceholder('E-mail').fill(uniqueEmail);
    await page.getByPlaceholder('Senha').fill(password);
    
    await Promise.all([
      page.waitForURL(/.*dashboard.*/, { timeout: 45000 }),
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
    const errorMsg = page.locator('[class*="error"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/already registered/i);
  });

  test('Deve redirecionar para login ao acessar dashboard sem sessão', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/.*login.*/);
  });
});
