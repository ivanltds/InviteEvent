import { test, expect } from '@playwright/test';

test.describe('Experiência do Convidado - Presentes', () => {
  let inviteSlug: string;

  test.beforeEach(async ({ page }) => {
    // 1. Garantir que estamos no Admin e temos um Presente
    await page.goto('/admin/presentes');
    await page.waitForLoadState('networkidle');
    const giftCount = await page.locator('button:has-text("Pausar")').count();
    
    if (giftCount === 0) {
      console.log('[Setup:Gifts] Criando presente de teste...');
      await page.getByRole('button', { name: /Novo Item/i }).click();
      await page.waitForSelector('#itemName');
      await page.locator('#itemName').fill('Presente Automático E2E');
      await page.locator('#itemPrice').fill('150');
      await page.locator('#itemQty').fill('1');
      await page.getByRole('button', { name: /Criar Presente/i }).click();
      await expect(page.getByText(/Presente Automático E2E/i)).toBeVisible({ timeout: 15000 });
    }

    // 2. Garantir que temos um Convidado para pegar o Slug
    await page.goto('/admin/convidados');
    await page.waitForLoadState('networkidle');
    
    let inviteBtn = page.locator('button[data-invite-slug]').first();
    const guestExists = await inviteBtn.isVisible();
    
    if (!guestExists) {
      console.log('[Setup:Gifts] Criando convidado de teste...');
      await page.getByRole('button', { name: /Novo Convite/i }).click();
      await page.waitForSelector('#inviteName');
      await page.locator('#inviteName').fill('Convidado E2E Gifts');
      await page.locator('#telefone').fill('11999999999');
      await page.getByRole('button', { name: /Criar Convite/i }).click();
      await expect(page.getByText(/Convidado E2E Gifts/i)).toBeVisible({ timeout: 15000 });
      inviteBtn = page.locator('button[data-invite-slug]').first();
    }

    inviteSlug = await inviteBtn.getAttribute('data-invite-slug') || '';
    console.log(`[Setup:Gifts] Slug capturado: ${inviteSlug}`);
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
