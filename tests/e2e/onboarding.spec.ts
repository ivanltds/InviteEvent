import { test, expect } from '@playwright/test';

test.describe('Onboarding PLG Flow - Happy Path', () => {
  test('Deve completar o onboarding completo com sucesso', async ({ page }) => {
    const uniqueNoiva = `Noiva_${Date.now()}`;
    const testEmail = `user-${Date.now()}@test.com`;

    await page.goto('/criar');

    // Passo 1: Nomes
    await page.getByPlaceholder('Ex: Maria').fill(uniqueNoiva);
    await page.getByPlaceholder('Ex: João').fill('Marcus');
    await page.getByText('Continuar ➜').click();

    // Passo 2: Estilo
    // Selecionar o primeiro card (Champagne) se disponível ou apenas avançar
    await page.getByText('Gerar meu convite ✨').click();

    // Passo 3: Preview e Claim
    await expect(page.getByText('Uau, o que achou?')).toBeVisible({ timeout: 15000 });
    await page.getByText('Finalizar e Salvar').click();

    // Passo 4: Cadastro
    await page.getByText('Não tem conta? Criar agora').click();
    await page.getByPlaceholder('Nome completo').fill('Usuário Onboarding');
    await page.getByPlaceholder('CPF').first().fill('12345678901');
    await page.getByPlaceholder('Telefone').first().fill('11999998888');
    await page.getByPlaceholder('E-mail').fill(testEmail);
    await page.getByPlaceholder('Senha').fill('Password123!');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    // Verificação Final: Redirecionamento para Dashboard
    // O sistema deve realizar auto-login para e-mails @test.com
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 30000 });
    await expect(page.getByText(uniqueNoiva)).toBeVisible();
  });

  test('Deve validar campos obrigatórios no cadastro', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByText('Não tem conta? Criar agora').click();

    // CPF inválido (menos dígitos)
    await page.getByPlaceholder('CPF').first().fill('123');
    await page.getByPlaceholder('E-mail').fill('invalid@test.com');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    // Deve impedir navegação para o dashboard
    await expect(page).not.toHaveURL(/.*dashboard.*/);
  });
});
