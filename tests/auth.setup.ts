import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/.auth/user.json';

setup('authenticate as master admin', async ({ page }) => {
  // Maior entropia para evitar colisões e rate limit persistente
  const uniqueEmail = `setup-stable-v10-${Date.now()}-${Math.floor(Math.random() * 10000)}@test.com`;

  // Ocultar dev overlays via InitScript (Garante execução ANTES de qualquer render)
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.innerHTML = 'nextjs-portal, .nextjs-portal { display: none !important; pointer-events: none !important; }';
    document.head.appendChild(style);
  });

  // 1. Iniciar onboarding
  await page.goto('/criar');
  await page.getByPlaceholder('Ex: Maria').fill('Maria v8');
  await page.getByPlaceholder('Ex: João').fill('Joao v8');
  await page.getByText('Continuar ➜').click();

  // 2. Passo de Cores
  await page.getByText('Sálvia Verde').click();
  await page.getByText(/Adorei! Continuar/i).click();

  // 3. Passo de Tipografia 
  await page.getByText('Great Vibes').click();
  await page.getByText(/Perfeito! Continuar/i).click();

  // 4. Passo de Foto -> Gerar Convite
  await page.getByText('Gerar meu convite ✨').click();

  // 5. Preview e Salvar
  // Clicar no Pular da animação (EnvelopeGateway)
  // Usamos text=Pular porque é um botão no EnvelopeGateway
  await page.getByText('Pular →').click({ timeout: 15000 });

  // Agora que o gateway fechou, o botão "Finalizar e Salvar" (que é um Link) deve aparecer
  const salvarBtn = page.getByText('Finalizar e Salvar');
  await expect(salvarBtn).toBeVisible({ timeout: 15000 });
  await salvarBtn.click();

  // 6. Cadastro
  await page.getByText(/Não tem conta/i).click();
  
  await page.getByPlaceholder('Nome completo').fill('Global Mega Admin');
  await page.getByPlaceholder('CPF').first().fill('00011122233');
  await page.getByPlaceholder('Telefone').first().fill('11900001111');
  await page.getByPlaceholder('E-mail').fill(uniqueEmail);
  await page.getByPlaceholder('Senha').fill('AdminPassword123!');
  
  // Clicar e aguardar navegação para dashboard
  await page.getByRole('button', { name: 'Cadastrar' }).click();
  await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 45000 });

  // 8. Salvar estado da sessão
  await page.context().storageState({ path: authFile });
});
