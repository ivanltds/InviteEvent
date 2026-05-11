import { test, expect } from '@playwright/test';

test.describe('PRD-010: Multi-Animação de Gateways (Cinematic Transitions)', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = 'nextjs-portal, .nextjs-portal { display: none !important; pointer-events: none !important; }';
      document.head.appendChild(style);
    });
  });

  test('Deve carregar e transitar a nova animação Pétalas ao Vento (flower_wind)', async ({ page }) => {
    await page.goto('/admin/configuracoes');
    await page.waitForLoadState('networkidle');

    // Utilizando seletores simplificados que consideram whitespace do JSX
    const flowerOpt = page.getByText('Pétalas ao Vento', { exact: true }).first();
    await flowerOpt.click({ force: true });
    
    await page.getByRole('button', { name: /Salvar Alterações/i }).first().click();
    await expect(page.getByText(/Configurações salvas com sucesso/i)).toBeVisible({ timeout: 15000 });

    await page.goto('/admin/visualizar');
    await page.waitForLoadState('networkidle');
    
    // Em flower_wind v1, a tela tem o SVG que desenhamos
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 15000 });
    console.log('[QA:Gateways] Pétalas ao Vento 1 renderizou com sucesso.');
  });

  test('Deve carregar e transitar a alternativa Pétalas ao Vento 2 (flower_wind_2)', async ({ page }) => {
    await page.goto('/admin/configuracoes');
    await page.waitForLoadState('networkidle');

    const flowerOptV2 = page.getByText('Pétalas ao Vento 2').first();
    await flowerOptV2.click({ force: true });
    
    await page.getByRole('button', { name: /Salvar Alterações/i }).first().click();
    await expect(page.getByText(/Configurações salvas com sucesso/i)).toBeVisible({ timeout: 15000 });

    await page.goto('/admin/visualizar');
    await page.waitForLoadState('networkidle');
    
    // Em flower_wind v2, o CTA "TOQUE PARA FLORESCER" existe no DOM
    const cta = page.getByText(/TOQUE PARA FLORESCER/i).first();
    await expect(cta).toBeVisible({ timeout: 15000 });

    await cta.click({ force: true });
    
    // Verifica se o redirecionamento/revelação do hero central ocorre
    const namesHeading = page.locator('h1.cursive').first();
    await expect(namesHeading).toBeVisible({ timeout: 20000 });
    
    console.log('[QA:Gateways] Pétalas ao Vento 2 completou fluxo com sucesso.');
  });
});
