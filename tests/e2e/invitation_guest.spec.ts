import { test, expect } from '@playwright/test';

test.describe('Experiência do Convidado - Fluxo Completo de Convite', () => {
  let inviteSlug: string;

  test.beforeEach(async ({ page }) => {
    // 1. Ocultar overlays de dev para evitar interceptação de cliques
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = 'nextjs-portal, .nextjs-portal { display: none !important; pointer-events: none !important; }';
      document.head.appendChild(style);
    });

    // 2. Ir para o admin (já logado via storageState)
    await page.goto('/admin/convidados');
    await page.waitForLoadState('networkidle');
    
    // Setup Autônomo: Criar convidado se necessário
    let linkBtn = page.locator('button[data-invite-slug]').first();
    const guestExists = await linkBtn.isVisible();

    if (!guestExists) {
        console.log('[Setup:RSVP] Criando convidado de teste...');
        await page.getByRole('button', { name: /Novo Convite/i }).click();
        await page.waitForSelector('#inviteName');
        await page.locator('#inviteName').fill('Convidado Teste RSVP');
        await page.locator('#type').selectOption('casal');
        await page.getByRole('button', { name: /Criar Convite/i }).click();
        await expect(page.locator('button[data-invite-slug]').first()).toBeVisible({ timeout: 15000 });
        linkBtn = page.locator('button[data-invite-slug]').first();
    }
    
    inviteSlug = await linkBtn.getAttribute('data-invite-slug') || '';
    console.log(`[Setup:RSVP] Usando slug: ${inviteSlug}`);
    expect(inviteSlug).not.toBe('');
  });

  test('Deve visualizar o site e realizar RSVP com sucesso', async ({ page }) => {
    // 1. Acessar o Site Público com preview=true (força envelope determinístico)
    await page.goto(`/inv/${inviteSlug}?preview=true`);
    await page.waitForLoadState('networkidle');
    
    // 2. Pular envelope (Animação de 1s + Skip)
    const skipBtn = page.getByTestId('skip-btn');
    await expect(skipBtn).toBeVisible({ timeout: 15000 });
    await skipBtn.click();

    // 3. Verificar Hero (Identidade Visual)
    await expect(page.locator('h1.cursive')).toBeVisible({ timeout: 10000 });
    const heroText = await page.locator('h1.cursive').innerText();
    expect(heroText.length).toBeGreaterThan(0);

    // 4. Realizar RSVP (Mecânica Central)
    await page.locator('#rsvp').scrollIntoViewIfNeeded();
    await page.locator('#confirmacao').selectOption('sim');
    await page.locator('#mensagem').fill('Vida longa ao casal! RSVP Automático.');
    await page.getByRole('button', { name: /Confirmar Presença/i }).click();

    // 5. Verificar Feedback Premium (Heartbeat e Sucesso)
    // O texto 'Que bom te ver' ou 'presença confirmada' deve aparecer
    await expect(page.getByText(/Que bom te ver/i).or(page.getByText(/presença confirmada/i))).toBeVisible({ timeout: 15000 });
    
    // Verificar se o ícone de coração animado (RSVP Polish) está lá
    await expect(page.getByText('❤️')).toBeVisible();
  });
});
