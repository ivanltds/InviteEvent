import { test, expect } from '@playwright/test';

test.describe('Suporte Integrado - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Ocultar overlays de desenvolvimento
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = 'nextjs-portal, .nextjs-portal { display: none !important; }';
      document.head.appendChild(style);
    });
    await page.goto('/admin/dashboard');
  });

  test('Deve abrir o widget de chat e validar ausência de SLA para cliente', async ({ page }) => {
    // 1. Verificar botão flutuante está presente na página
    const triggerBtn = page.getByLabel('Abrir suporte por chat');
    await expect(triggerBtn).toBeVisible();

    // 2. Clicar para abrir a gaveta
    await triggerBtn.click();

    // 3. Verificar se o cabeçalho abriu corretamente
    await expect(page.getByText('Suporte ao Cliente')).toBeVisible();
    
    // 4. Validar Regra de Negócio: Cliente NUNCA vê "SLA Restante"
    await expect(page.getByText(/SLA/i)).not.toBeVisible();
  });
});
