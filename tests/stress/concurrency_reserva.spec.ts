import { test, expect } from '@playwright/test';

/**
 * PRD-018: Teste de Estresse de Concorrência Massiva (V3 - Dialog Handling)
 * Simula usuários tentando reservar o ÚNICO item disponível ao mesmo tempo.
 */

const STRESS_WORKERS = 15;
const TARGET_GIFT_NAME = "ITEM STRESS ÚNICO";

test.describe('Stress: Concorrência de Reserva (15 Browsers)', () => {

  for (let i = 1; i <= STRESS_WORKERS; i++) {
    test(`Cenário Concorrente #${i}: Tentativa de Reserva Massiva`, async ({ page }) => {
      let finalOutcome: string = 'NONE';

      // Captura o diálogo (alert) de conflito
      page.on('dialog', async dialog => {
        if (dialog.message().includes('acabou de ser escolhido')) {
          finalOutcome = 'CONFLICT';
        }
        await dialog.dismiss();
      });

      // 1. Acesso à vitrine
      await page.goto('/presentes?invite=visitante-stress');
      await page.waitForLoadState('networkidle');

      // 2. Localizar o item
      const giftCard = page.locator(`div[class*="card"]:has-text("${TARGET_GIFT_NAME}")`);
      await expect(giftCard).toBeVisible({ timeout: 20000 });

      // 3. Abrir Detalhes
      await giftCard.getByRole('button', { name: /Ver Detalhes/i }).click();

      // 4. Tentar Reservar
      const btnComprar = page.locator('button:has-text("Comprar Online")');
      await expect(btnComprar).toBeVisible();
      await btnComprar.click();

      // 5. Verificação de Resultados (Polling)
      await page.waitForFunction((outcome) => {
        const text = document.body.innerText;
        return text.includes('Ativada com Sucesso!') || 
               text.includes('Tivemos um pequeno tropeço') ||
               (window as any)['stress_outcome'] === 'CONFLICT'; // Variável global de sinalização
      }, null, { timeout: 20000 }).catch(() => {});

      // Fallback: Se o outcome de diálogo foi setado, usamos ele
      const successBadge = await page.locator('text=Ativada com Sucesso!').isVisible();
      const resilientError = await page.locator('text=Tivemos um pequeno tropeço').isVisible();
      
      const realOutcome = successBadge ? '✅ SUCESSO' : (finalOutcome === 'CONFLICT' ? '⚠️ CONFLITO' : resilientError ? '🛡️ ERRO_RESILIENTE' : '❓ DESCONHECIDO');

      console.log(`[Worker #${i}] Resultado: ${realOutcome}`);
      
      // O teste passa se chegar em um dos estados esperados
      expect(successBadge || finalOutcome === 'CONFLICT' || resilientError).toBe(true);
    });
  }
});
