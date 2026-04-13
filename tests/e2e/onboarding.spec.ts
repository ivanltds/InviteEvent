import { test, expect } from '@playwright/test';

test('Onboarding PLG Flow - Happy Path', async ({ page }) => {
  // 1. Início na Landing Page
  await page.goto('/');
  
  // O botão na Home é um Link com o texto abaixo
  const startBtn = page.getByRole('link', { name: /Experimentar meu Evento agora/i }).first();
  await startBtn.click();

  // 2. Passo 1: Nomes
  await expect(page).toHaveURL(/\/criar/);
  await page.getByPlaceholder('Ex: Maria').fill('Noiva Teste');
  await page.getByPlaceholder('Ex: João').fill('Noivo Teste');
  await page.getByText('Continuar ➜').click();

  // 3. Passo 2: Cores
  await page.getByText('Sálvia Verde').click();
  await page.getByText('Adorei! Continuar ➜').click();

  // 4. Passo 3: Tipografia
  await page.getByText('Great Vibes').click();
  await page.getByText('Perfeito! Continuar ➜').click();

  // 5. Passo 4: Foto (Pular)
  await page.getByText('Gerar meu convite ✨').click();

  // 6. Preview & Envelope Animation
  await expect(page).toHaveURL(/\/inv\/preview/);
  
  // O EnvelopeGateway é exibido primeiro. Vamos pular para ganhar tempo no teste.
  const skipBtn = page.getByTestId('skip-btn');
  await expect(skipBtn).toBeVisible({ timeout: 10000 });
  await skipBtn.click();

  // Agora a barra flutuante premium deve estar visível
  await page.getByText('Finalizar e Salvar').click();

  // 7. Cadastro
  await expect(page).toHaveURL(/\/admin\/login/);
  
  // Mudar para modo cadastro se necessário
  const signupToggle = page.getByText('Não tem conta? Criar agora');
  if (await signupToggle.isVisible()) {
    await signupToggle.click();
  }

  const testEmail = `test-${Date.now()}@example.com`;
  await page.getByPlaceholder('Nome completo').fill('Usuario Teste E2E');
  await page.getByPlaceholder('CPF (000.000.000-00)').fill('12345678901');
  await page.getByPlaceholder('Telefone / WhatsApp').fill('11999999999');
  await page.getByPlaceholder('E-mail').fill(testEmail);
  await page.getByPlaceholder('Senha (mínimo 6 caracteres)').fill('TestPassword123!');
  
  await page.getByRole('button', { name: 'Cadastrar' }).click();

  // 8. Verificação de Sucesso Pendente (E-mail enviado - Story: Email Friction Fix)
  await expect(page.getByText(/Quase lá/i)).toBeVisible();
  await expect(page.getByText(testEmail)).toBeVisible();
});
