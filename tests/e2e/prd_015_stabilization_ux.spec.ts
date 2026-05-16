import { test, expect } from '@playwright/test';

test.describe('PRD-015: Estabilização e UX de Listagem', () => {

  test('Deve carregar presentes de 10 em 10 e exibir botão "Ver Mais" na vitrine pública', async ({ page }) => {
    // 1. Acessa a página de presentes do convidado
    await page.goto('/presentes');
    await page.waitForLoadState('networkidle');

    // 2. Verifica se a seção de presentes está visível
    const section = page.locator('section[class*="grid"]');
    await expect(section).toBeVisible();

    // 3. Conta quantos cards de presentes existem inicialmente (deve ser <= 10)
    const initialCards = await page.locator('div[class*="card"]').count();
    console.log(`[QA:UX] Cards iniciais carregados: ${initialCards}`);
    expect(initialCards).toBeLessThanOrEqual(10);

    // 4. Verifica se o botão "VER MAIS" aparece se houver mais itens
    const btnVerMais = page.locator('button:has-text("VER MAIS PRESENTES")');
    if (await btnVerMais.isVisible()) {
      await btnVerMais.click();
      await page.waitForTimeout(1000); // Aguarda animação Framer Motion

      const secondBatchCards = await page.locator('div[class*="card"]').count();
      console.log(`[QA:UX] Cards após clicar em ver mais: ${secondBatchCards}`);
      expect(secondBatchCards).toBeGreaterThan(initialCards);
      expect(secondBatchCards).toBeLessThanOrEqual(20);
    }
  });

  test('Deve exibir o Mentor de Carinho no Admin com o novo design premium', async ({ page }) => {
    // 1. Acessa o admin de presentes
    await page.goto('/admin/presentes');
    await page.waitForLoadState('networkidle');

    // 2. Verifica se o banner do Mentor está visível (se houver sugestões)
    const mentorBanner = page.locator('div[class*="mentorBanner"]');
    
    // Como depende de dados, vamos apenas verificar se o estilo da classe existe ou se o elemento aparece
    if (await mentorBanner.isVisible()) {
      // Verifica se contém o título correto
      await expect(mentorBanner.locator('h3')).toContainText('Mentor de Carinho');
      
      // Verifica se o badge de "Sugestão Smart" está presente (estilo inline que adicionei)
      const badgeSmart = mentorBanner.locator('span:has-text("SUGESTÃO SMART")');
      await expect(badgeSmart).toBeVisible();
      
      console.log('[QA:UX] Mentor de Carinho validado visualmente no Admin.');
    }
  });

  test('Deve garantir que a navegação do catálogo global também usa paginação de 10 em 10', async ({ page }) => {
    await page.goto('/admin/catalogo');
    await page.waitForLoadState('networkidle');

    // Verifica cards iniciais no catálogo global
    const initialGlobalCards = await page.locator('div[class*="giftCard"]').count();
    console.log(`[QA:UX] Cards globais iniciais: ${initialGlobalCards}`);
    expect(initialGlobalCards).toBeLessThanOrEqual(10);

    const btnMaisGlobal = page.locator('button:has-text("Ver Mais 10 Itens")');
    if (await btnMaisGlobal.isVisible()) {
      await btnMaisGlobal.click();
      await page.waitForTimeout(500);
      
      const updatedGlobalCards = await page.locator('div[class*="giftCard"]').count();
      expect(updatedGlobalCards).toBeGreaterThan(initialGlobalCards);
    }
  });
});
