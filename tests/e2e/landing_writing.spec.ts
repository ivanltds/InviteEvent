import { test, expect } from '@playwright/test';

test.describe('Landing Page Copywriting Premium', () => {
  test('Deve exibir textos de alta-costura sofisticados e persuasivos', async ({ page }) => {
    await page.goto('/');

    // 1. Validar Hero Section
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toContainText('O Convite do Seu Casamento');
    await expect(heroTitle).toContainText('Obra de Arte');

    // 2. Validar Seção Split (Efeito WOW)
    const splitHeading = page.locator('h2');
    await expect(splitHeading.filter({ hasText: 'Incomparável desde o primeiro toque' })).toBeVisible();

    // 3. Validar Itens do Bento Grid
    await expect(page.getByRole('heading', { name: 'Lista de Presentes com Resgate em Pix' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'RSVP Inteligente e Nominal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mural Interativo de Memórias' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Identidade Visual Exclusiva' })).toBeVisible();
  });
});
