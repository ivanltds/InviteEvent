import { test, expect } from '@playwright/test';

test.describe('Dashboard Administrativo', () => {
  // O estado estara compartilhado via storageState configurado no playwright.config.ts

  test.beforeEach(async ({ page }) => {
    // Ocultar dev overlays via InitScript (Garante execução ANTES de qualquer render)
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = 'nextjs-portal, .nextjs-portal { display: none !important; pointer-events: none !important; }';
      document.head.appendChild(style);
    });

    await page.goto('/admin/dashboard');
    // Se estivermos na dashboard, precisamos garantir que um evento esteja selecionado
    // Como o setup cria um evento, vamos clicar nele se aparecer a lista
    const eventLink = page.getByText(/Casamento de/);
    if (await eventLink.isVisible()) {
        await eventLink.click();
    }
  });

  test('Deve gerenciar convidados (CRUD completo)', async ({ page }) => {
    await page.goto('/admin/convidados');
    
    // Esperar o carregamento inicial do contexto de evento
    await expect(page.getByText('Carregando...')).not.toBeVisible({ timeout: 15000 });
    
    // 1. Criar novo convite
    await page.getByRole('button', { name: 'Novo Convite' }).click();
    await page.locator('#inviteName').fill(`Convidado ${Date.now()}`);
    await page.selectOption('#type', 'casal');
    await page.getByRole('button', { name: 'Criar Convite' }).click();
    
    // Usar seletor específico da classe de nome do convidado para evitar ambiguidades com o sidebar/heading
    const guestLocator = page.locator('[class*="guestName"]');
    await expect(guestLocator.first()).toBeVisible();

    // 2. Editar convite
    await page.getByRole('button', { name: 'Editar' }).first().click();
    await page.locator('#inviteName').fill(`Convidado Editado ${Date.now()}`);
    await page.click('button:has-text("Salvar Alterações")');
    await expect(page.locator('[class*="guestName"]').first()).toContainText('Editado');

    // 3. Excluir convite
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await expect(page.locator('[class*="guestName"]').filter({ hasText: 'Editado' })).not.toBeVisible();
  });

  test('Deve gerenciar presentes (CRUD completo)', async ({ page }) => {
    await page.goto('/admin/presentes');
    
    await page.getByRole('button', { name: 'Novo Item' }).click();
    await page.locator('#itemName').fill('Item Teste');
    await page.locator('#itemPrice').fill('150');
    await page.locator('#itemQty').fill('1');
    await page.getByRole('button', { name: 'Criar Presente' }).click();

    await expect(page.getByText('Item Teste')).toBeVisible();

    // Pausar/Ativar item
    await page.getByRole('button', { name: 'Pausar/Ativar' }).first().click();
    await expect(page.getByText('pausado')).toBeVisible();

    // Excluir item
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Remover' }).first().click();
    await expect(page.getByText('Item Teste')).not.toBeVisible();
  });

  test('Deve customizar estilos e identididade visual', async ({ page }) => {
    await page.goto('/admin/configuracoes');
    
    await page.locator('#noiva_nome').fill('Noiva Admin');
    await page.locator('#noivo_nome').fill('Noivo Admin');
    await page.locator('#accent_color').fill('#0000ff'); // Azul
    
    await page.getByRole('button', { name: 'Salvar Todas as Alterações' }).click();
    await expect(page.getByText('Salvando...')).not.toBeVisible();

    await page.reload();
    await expect(page.locator('#noiva_nome')).toHaveValue('Noiva Admin');
    await expect(page.locator('#accent_color')).toHaveValue('#0000ff');
  });

  test('Deve gerenciar equipe (Adicionar organizador)', async ({ page }) => {
    await page.goto('/admin/configuracoes'); 
    
    // Esperar carregamento das configurações
    await expect(page.getByText('Carregando configurações...')).not.toBeVisible({ timeout: 15000 });
    
    // TeamManagement agora usa feedback na UI para erros e sucessos (v3)
    const teamSection = page.locator('section').filter({ hasText: 'Equipe de Organizadores' });
    await teamSection.scrollIntoViewIfNeeded();

    await teamSection.getByPlaceholder('E-mail do usuário').fill('staff@test.com');
    await teamSection.getByRole('button', { name: 'Adicionar' }).click();

    await expect(teamSection.getByText(/staff@test.com/i).or(teamSection.getByText(/não encontrado/i))).toBeVisible();
  });

  test('Deve gerenciar FAQ do evento', async ({ page }) => {
    await page.goto('/admin/configuracoes');
    
    // Esperar carregamento das configurações
    await expect(page.getByText('Carregando configurações...')).not.toBeVisible({ timeout: 15000 });

    const faqSection = page.locator('section').filter({ hasText: 'Perguntas Frequentes (FAQ)' });
    await faqSection.getByPlaceholder(/Pergunta/i).fill('Qual o traje?');
    await faqSection.getByPlaceholder(/Resposta/i).fill('Traje esporte fino.');
    await faqSection.getByRole('button', { name: 'Adicionar' }).click();

    await expect(faqSection.getByText('Qual o traje?')).toBeVisible();

    // Excluir FAQ
    page.once('dialog', dialog => dialog.accept());
    await faqSection.getByRole('button', { name: 'Excluir' }).last().click();
    await expect(faqSection.getByText('Qual o traje?')).not.toBeVisible();
  });
});
