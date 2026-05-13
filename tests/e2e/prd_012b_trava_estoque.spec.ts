import { test, expect } from '@playwright/test';

test.describe('PRD-012B: Motor de Monetização e Trava Temporária de 3h', () => {
  let inviteSlug: string;
  let uniqueGiftName: string;

  test.beforeEach(async ({ page }) => {
    // Ocultar overlays de dev para evitar interceptação de cliques
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = 'nextjs-portal, .nextjs-portal { display: none !important; pointer-events: none !important; }';
      document.head.appendChild(style);
    });

    // 1. Criar um presente isolado e único para evitar conflitos de travas com runs anteriores
    await page.goto('/admin/presentes');
    await page.waitForLoadState('networkidle');
    
    const suffix = Math.random().toString(36).substring(7);
    uniqueGiftName = `Presente Trava ${suffix}`;
    console.log(`[Setup:TravaEstoque] Criando presente isolado: ${uniqueGiftName}`);

    await page.locator('button:has-text("Novo Presente")').click();
    await page.locator('label:has-text("Nome do Presente") + input').fill(uniqueGiftName);
    await page.locator('label:has-text("Preço Estimado (R$)") + input').fill('200');
    await page.locator('label:has-text("Quantidade Total") + input').fill('1');
    // Coloca um link de compra parceiro no input correspondente
    await page.locator('label:has-text("Link Loja") + input').fill('https://www.magazineluiza.com.br/e2e-mock');
    
    // Salva pela Floating Action Bar
    const btnSalvar = page.locator('button:has-text("Salvar Agora")');
    await btnSalvar.click();
    
    // Garante o término da criação aguardando a renderização do item no grid administrativo
    await expect(page.locator(`h3:has-text("${uniqueGiftName}")`)).toBeVisible({ timeout: 15000 });

    // 2. Garantir que temos um Convidado ativo para obter o Slug do URL
    await page.goto('/admin/convidados');
    await page.waitForLoadState('networkidle');
    
    let inviteBtn = page.locator('button[data-invite-slug]').first();
    let guestExists = await inviteBtn.count() > 0;
    
    if (!guestExists) {
      console.log('[Setup:TravaEstoque] Criando convidado de teste...');
      await page.locator('button:has-text("Novo Convite")').click();
      await page.locator('#inviteName').fill('Visitante Trava E2E');
      await page.locator('button:has-text("Criar Convite")').click();
      await page.waitForTimeout(1000);
      inviteBtn = page.locator('button[data-invite-slug]').first();
    }

    inviteSlug = await inviteBtn.getAttribute('data-invite-slug') || '';
    console.log(`[Setup:TravaEstoque] Slug para teste de trava: ${inviteSlug}`);
  });

  test('Deve conter o botão premium de Aceleração de Checkout PIX Direto no modal', async ({ page }) => {
    // Acessa a vitrine pública
    await page.goto(`/presentes?invite=${inviteSlug}`);
    await page.waitForLoadState('networkidle');

    // Aguarda o sumiço do EmotionalIntro, caso ativo
    await page.waitForTimeout(6000); 

    // Garante que a vitrine renderizou o item isolado específico
    const specificGiftCard = page.locator(`div[class*="card"]:has-text("${uniqueGiftName}")`);
    await expect(specificGiftCard).toBeVisible({ timeout: 15000 });
    const btnDetalhes = specificGiftCard.getByRole('button', { name: /Ver Detalhes/i });

    // Abre o modal de detalhes do primeiro item do grid
    await btnDetalhes.click();

    // Verifica a presença do botão em destaque
    const btnPixAgora = page.locator('button:has-text("Presentear via PIX Agora")');
    await expect(btnPixAgora).toBeVisible({ timeout: 10000 });

    console.log('[QA:TravaEstoque] Botão de Checkout PIX acelerado validado com sucesso no modal.');
  });

  test('Deve ativar o Interstitial de 4 segundos e registrar trava ao clicar em Comprar Online', async ({ page }) => {
    // Acessa a vitrine pública
    await page.goto(`/presentes?invite=${inviteSlug}`);
    await page.waitForLoadState('networkidle');

    // Aguarda EmotionalIntro sumir
    await page.waitForTimeout(6000); 

    // Garante que a vitrine renderizou o item isolado específico
    const specificGiftCard2 = page.locator(`div[class*="card"]:has-text("${uniqueGiftName}")`);
    await expect(specificGiftCard2).toBeVisible({ timeout: 15000 });
    const btnDetalhes2 = specificGiftCard2.getByRole('button', { name: /Ver Detalhes/i });

    // Abre detalhes
    await btnDetalhes2.click();

    // Prepara interceptação de popups uma vez que 'Comprar Online' aciona window.open
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null), // Prevê erros caso o popup seja bloqueado pelo navegador local do runner
      page.locator('button:has-text("Comprar Online")').click()
    ]);

    // IMEDIATAMENTE verifica se o Overlay Intersticial é renderizado
    const interstitialOverlay = page.locator('div:has-text("Redirecionando para parceiro...")').first();
    await expect(interstitialOverlay).toBeVisible({ timeout: 3000 });

    // Verifica se exibe o selo de que a trava foi aplicada
    const badgeSucesso = page.locator('div:has-text("Trava de 3 Horas Ativada com Sucesso!")').first();
    await expect(badgeSucesso).toBeVisible();

    console.log('[QA:TravaEstoque] Fluxo intersticial de intermediação e retenção do item por 3h validado com êxito.');
  });

});
