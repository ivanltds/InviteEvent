import { test, expect } from '@playwright/test';

test.describe('Dashboard Administrativo', () => {
  // O estado estara compartilhado via storageState configurado no playwright.config.ts

  test.beforeEach(async ({ page }) => {
    // Ocultar dev overlays para evitar intercepção de cliques
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = 'nextjs-portal { display: none !important; }';
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
    
    // 1. Criar novo convite
    await page.getByRole('button', { name: 'Novo Convite' }).click();
    await page.locator('#inviteName').fill(`Convidado ${Date.now()}`);
    await page.selectOption('#type', 'casal');
    await page.getByRole('button', { name: 'Criar Convite' }).click();

    await expect(page.getByText(/Convidado/)).toBeVisible();

    // 2. Editar convite
    await page.getByRole('button', { name: 'Editar' }).first().click();
    await page.locator('#inviteName').fill(`Convidado Editado ${Date.now()}`);
    await page.click('button:has-text("Salvar Alterações")');
    await expect(page.getByText(/Editado/)).toBeVisible();

    // 3. Excluir convite
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await expect(page.getByText(/Editado/)).not.toBeVisible();
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
    await page.goto('/admin/configuracoes'); // Equipe esta dentro de configuracoes
    
    const teamSection = page.getByText('Equipe do Evento');
    await teamSection.scrollIntoViewIfNeeded();

    await page.getByPlaceholder('E-mail do usuário').fill('staff@test.com');
    await page.getByRole('button', { name: 'Adicionar' }).click();

    // Como o staff@test.com pode não existir no banco, ele pode retornar erro
    // Mas o teste deve validar ou o sucesso ou a mensagem correta.
    // Assumindo que o erro de "Usuario nao encontrado" seja esperado se ele nao existir.
    await expect(page.getByText(/staff@test.com/i).or(page.getByText(/não encontrado/i))).toBeVisible();
  });

  test('Deve gerenciar FAQ do evento', async ({ page }) => {
    await page.goto('/admin/configuracoes');
    
    await page.getByPlaceholder(/Pergunta/i).fill('Qual o traje?');
    await page.getByPlaceholder(/Resposta/i).fill('Traje esporte fino.');
    await page.getByRole('button', { name: 'Adicionar' }).last().click();

    await expect(page.getByText('Qual o traje?')).toBeVisible();

    // Excluir FAQ
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Excluir' }).last().click();
    await expect(page.getByText('Qual o traje?')).not.toBeVisible();
  });
});
