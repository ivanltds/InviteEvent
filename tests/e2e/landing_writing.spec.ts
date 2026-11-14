import { test, expect } from '@playwright/test';

test.describe('Landing Page Celebraê', () => {
  test('mostra o convite de exemplo, o título e as seções do produto', async ({ page }) => {
    await page.goto('/?abertura=pet');

    await expect(page.locator('h1')).toContainText('Convite de casamento digital');
    // o convite aparece depois da abertura (Pétalas ao Vento)
    await expect(page.locator('#topo .inv__names')).toContainText('Lia', { timeout: 8000 });

    await expect(page.getByRole('heading', { name: /Cinco aberturas/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Lista de presença/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Lista de presentes/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Mural de fotos e recados/ })).toBeVisible();
  });

  test('os nomes digitados viram o convite do casal', async ({ page, isMobile }) => {
    await page.goto('/?abertura=pet');
    await page.getByRole('button', { name: 'Pular abertura' }).click();
    if (isMobile) await page.getByRole('button', { name: /Ver com os nomes de vocês/ }).click();
    await page.locator('#n1').fill('Ana');
    await page.locator('#n2').fill('Bruno');
    await expect(page.locator('#topo .inv__names')).toContainText('Ana');
    await expect(page.locator('#topo .inv__names')).toContainText('Bruno');
  });
});
