import { test as setup, expect } from '@playwright/test';

setup('Setup Stress Environment', async ({ page }) => {
  console.log('[Setup:Stress] Preparando ambiente de carga massiva...');

  // 1. Garantir que estamos logados como Admin
  await page.goto('/admin/presentes');
  
  // Apenas navegamos para garantir que a sessão está ok
  await page.goto('/presentes?invite=visitante-stress');
  await expect(page.locator('h3:has-text("ITEM STRESS ÚNICO")')).toBeVisible({ timeout: 15000 });

  console.log('[Setup:Stress] Ambiente verificado e pronto.');
});
