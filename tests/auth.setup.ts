import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/.auth/user.json';

setup('authenticate as master admin', async ({ page }) => {
  const uniqueSuffix = Date.now();
  const uniqueEmail = `setup-resilient-${uniqueSuffix}@test.com`;

  // Definir flag global de Playwright para suprimir DOM mutations instáveis
  await page.addInitScript(() => {
    (window as any).isPlaywright = true;
  });

  // Auto-dismiss de alerts residuais
  page.on('dialog', dialog => dialog.dismiss().catch(() => {}));

  // 1. Iniciar onboarding
  await page.goto('/criar');
  
  // Injetar estilos de bypass de overlay do Next.js
  await page.addStyleTag({ content: 'nextjs-portal, .nextjs-portal { display: none !important; }' }).catch(() => {});

  await page.getByPlaceholder('Ex: Maria').fill('Maria Setup');
  await page.getByPlaceholder('Ex: João').fill('Joao Setup');
  await page.getByText(/Continuar/i).first().click({ force: true });

  // 2. Passo de Cores
  await expect(page.getByText(/As cores dão o tom/i)).toBeVisible();
  await page.getByText(/Adorei! Continuar/i).click({ force: true });

  // 3. Passo de Tipografia 
  await expect(page.getByText(/A letra conta uma história/i)).toBeVisible();
  await page.getByText(/Perfeito! Continuar/i).click({ force: true });

  // 4. Gerar Convite
  await page.evaluate(() => localStorage.setItem('skip_gateway', 'true'));
  const genBtn = page.getByText(/Gerar meu convite/i);
  await expect(genBtn).toBeVisible();
  await genBtn.click({ force: true });

  // 5. Preview e Salvar - Instantâneo via LocalStorage Bypass
  await page.waitForURL(url => url.toString().includes('preview'), { timeout: 15000 });

  const salvarBtn = page.getByText('Finalizar e Salvar');
  await expect(salvarBtn).toBeVisible({ timeout: 15000 });
  await salvarBtn.click({ force: true });

  // 6. Cadastro
  await page.waitForURL(/.*login.*/, { timeout: 15000 });
  const uniqueCPF = Math.floor(Math.random() * 90000000000 + 10000000000).toString();
  const uniqueTel = `119${Math.floor(Math.random() * 90000000 + 10000000)}`;
  
  await page.getByPlaceholder('Nome completo').fill('Setup Master Admin');
  await page.getByPlaceholder('CPF').first().fill(uniqueCPF);
  await page.getByPlaceholder('Telefone').fill(uniqueTel);
  await page.getByPlaceholder('E-mail').fill(uniqueEmail);
  await page.getByPlaceholder('Senha').fill('AdminPassword123!');
  
  await page.getByRole('button', { name: /Cadastrar/i }).click({ force: true });
  
  // Aguarda configurações com tolerância alta para primeira carga (Novo landing UX)
  await expect(page).toHaveURL(/.*configuracoes.*/, { timeout: 45000 });
  await page.waitForLoadState('networkidle');

  // 8. Salvar estado da sessão
  await page.context().storageState({ path: authFile });
});
