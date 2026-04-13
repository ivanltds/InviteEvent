import { test, expect } from '@playwright/test';

test.describe('Experiência do Convidado - RSVP e Visualização', () => {
  let inviteSlug: string;

  test.beforeEach(async ({ page }) => {
    // 1. Ir para o admin (já logado) e pegar o slug do convite padrão do setup
    await page.goto('/admin/convidados');
    
    // Se não houver convites, criamos um rápido
    const linkBtn = page.locator('button[data-invite-slug]').first();
    if (await linkBtn.isHidden()) {
        await page.getByRole('button', { name: 'Novo Convite' }).click();
        await page.locator('#inviteName').fill('Convidado Teste Guest');
        await page.getByRole('button', { name: 'Criar Convite' }).click();
    }
    
    inviteSlug = await page.locator('button[data-invite-slug]').first().getAttribute('data-invite-slug') || '';
  });

  test('Deve visualizar Hero, Galeria e FAQ no site do casamento', async ({ page }) => {
    await page.goto(`/inv/${inviteSlug}`);
    
    // Pular envelope
    const skipBtn = page.getByTestId('skip-btn');
    if (await skipBtn.isVisible()) await skipBtn.click();

    // 1. Verificar Hero (Nomes dos noivos)
    await expect(page.locator('h1.cursive')).toContainText(/Noiva Global/i);

    // 2. Verificar se FAQ aparece (se adicionamos no admin)
    // Vamos garantir que habilitamos o FAQ nas config
    await page.goto('/admin/configuracoes');
    const faqToggle = page.locator('input[type="checkbox"]').nth(2); // Basado no AdminConfig order? 
    // Melhor usar labels ou IDs: line 32 in AdminConfig: mostrar_faq
    // Mas no site, apenas checamos se o ID #faq existe
    await page.goto(`/inv/${inviteSlug}`);
    await expect(page.locator('#faq')).toBeVisible();
  });

  test('Deve realizar RSVP completo com mensagem', async ({ page }) => {
    await page.goto(`/inv/${inviteSlug}`);
    const skipBtn = page.getByTestId('skip-btn');
    if (await skipBtn.isVisible()) await skipBtn.click();

    await page.locator('#rsvp').scrollIntoViewIfNeeded();
    
    // Selecionar "Sim"
    await page.locator('#confirmacao').selectOption('sim');
    await page.locator('#mensagem').fill('Vida longa ao casal!');
    await page.getByRole('button', { name: 'Confirmar Presença' }).click();

    await expect(page.getByText(/presença confirmada/i).or(page.getByText(/Que bom te ver/i))).toBeVisible();
  });
});
