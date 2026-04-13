import { test, expect } from '@playwright/test';

test.describe('Experiência do Convidado - Presentes', () => {
  let inviteSlug: string;

  test.beforeEach(async ({ page }) => {
    // 1. Pegar slug via admin (já logado via setup)
    await page.goto('/admin/convidados');
    
    // Garantir que temos um presente cadastrado
    await page.goto('/admin/presentes');
    const hasGifts = await page.getByText(/pausar/i).count();
    
    if (hasGifts === 0) {
        await page.getByRole('button', { name: 'Novo Item' }).click();
        await page.locator('#itemName').fill('Presente E2E');
        await page.locator('#itemPrice').fill('100');
        await page.locator('#itemQty').fill('1');
        await page.getByRole('button', { name: 'Criar Presente' }).click();
    }

    await page.goto('/admin/convidados');
    inviteSlug = await page.locator('button[data-invite-slug]').first().getAttribute('data-invite-slug') || '';
  });

  test('Deve reservar um presente e verificar concorrência', async ({ page, browser }) => {
    // 1. Acesso à página de presentes
    await page.goto(`/presentes?invite=${inviteSlug}`);
    
    // 2. Reserva básica com sucesso
    await page.getByRole('button', { name: 'Presentear' }).first().click();
    await page.locator('[data-testid="e2e-force-reserve"]').dispatchEvent('click');
    await expect(page.getByText('Muito Obrigado!')).toBeVisible();

    // 3. Teste de Concorrência (Novo Contexto tenta o mesmo item)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(`/presentes?invite=${inviteSlug}`);
    
    // O item deve aparecer como "Item Esgotado" ou "Reservado"
    await expect(page2.getByRole('button', { name: 'Item Esgotado' }).or(page2.getByText(/Esgotado/i))).toBeVisible();
    
    await context2.close();
  });
});
