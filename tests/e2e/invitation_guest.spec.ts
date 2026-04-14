import { test, expect } from '@playwright/test';

test.describe('Experiência do Convidado - RSVP e Visualização', () => {
  let inviteSlug: string;

  test.beforeEach(async ({ page }) => {
    // 1. Ocultar overlays de dev
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = 'nextjs-portal, .nextjs-portal { display: none !important; pointer-events: none !important; }';
      document.head.appendChild(style);
    });

    // 2. Ir para o admin (já logado)
    await page.goto('/admin/convidados');
    
    // Garantir que um evento esteja selecionado
    const eventLink = page.getByText(/Casamento de/);
    try {
        await eventLink.waitFor({ state: 'visible', timeout: 5000 });
        await eventLink.click();
    } catch (e) {
        console.log('Evento já selecionado ou lista não apareceu');
    }

    // Esperar o carregamento inicial
    await expect(page.getByText('Carregando...')).not.toBeVisible({ timeout: 15000 });
    
    // Se não houver convites, criamos um rápido
    const linkBtn = page.locator('button[data-invite-slug]').first();
    if (await linkBtn.isHidden()) {
        await page.getByRole('button', { name: 'Novo Convite' }).click();
        await page.locator('#inviteName').fill('Convidado Teste Guest');
        await page.locator('#type').selectOption('casal'); // Garantir tipo casal
        await page.getByRole('button', { name: 'Criar Convite' }).click();
        await expect(page.locator('button[data-invite-slug]').first()).toBeVisible({ timeout: 10000 });
    }
    
    const inviteBtn = page.locator('button[data-invite-slug]').first();
    await expect(inviteBtn).toBeVisible({ timeout: 10000 });
    inviteSlug = await inviteBtn.getAttribute('data-invite-slug') || '';
    console.log(`Invite Slug capturado: ${inviteSlug}`);
    expect(inviteSlug).not.toBe('');
  });

  test('Deve visualizar Hero, Galeria e FAQ no site do casamento', async ({ page }) => {
    // Usar ?preview=true para garantir que o envelope sempre apareça em testes determinísticos
    await page.goto(`/inv/${inviteSlug}?preview=true`);
    
    // Pular envelope
    const skipBtn = page.getByTestId('skip-btn');
    // O botão de skip aparece após 1s de delay no componente
    await expect(skipBtn).toBeVisible({ timeout: 10000 });
    await skipBtn.click();

    // 1. Verificar Hero (Nomes dos noivos)
    await expect(page.locator('h1.cursive')).toBeVisible({ timeout: 10000 });
    const heroText = await page.locator('h1.cursive').innerText();
    expect(heroText.length).toBeGreaterThan(0);

    // 2. Verificar se FAQ aparece após habilitar no admin
    await page.goto('/admin/configuracoes');
    await expect(page.getByText('Carregando configurações...')).not.toBeVisible({ timeout: 15000 });
    
    const faqToggle = page.locator('#mostrar_faq'); 
    if (!(await faqToggle.isChecked())) {
        await faqToggle.click();
        await page.getByRole('button', { name: 'Salvar Todas as Alterações' }).click();
        await expect(page.getByText('Salvando...')).not.toBeVisible();
    }
    
    await page.goto(`/inv/${inviteSlug}?preview=true`);
    // Pular envelope
    await expect(page.getByTestId('skip-btn')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('skip-btn').click();

    await expect(page.locator('#faq')).toBeVisible({ timeout: 10000 });
  });

  test('Deve realizar RSVP completo com mensagem', async ({ page }) => {
    await page.goto(`/inv/${inviteSlug}?preview=true`);
    
    // Pular envelope
    const skipBtn = page.getByTestId('skip-btn');
    await expect(skipBtn).toBeVisible({ timeout: 10000 });
    await skipBtn.click();

    await page.locator('#rsvp').scrollIntoViewIfNeeded();
    
    // Selecionar "Sim"
    await page.locator('#confirmacao').selectOption('sim');
    await page.locator('#mensagem').fill('Vida longa ao casal!');
    await page.getByRole('button', { name: 'Confirmar Presença' }).click();

    // Esperar um dos textos de sucesso
    await expect(page.getByText(/presença confirmada/i).or(page.getByText(/Que bom te ver/i))).toBeVisible({ timeout: 10000 });
  });
});
