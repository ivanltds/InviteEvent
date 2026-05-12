import { test, expect } from '@playwright/test';

test.describe('PRD-011: Modo Telão Realtime (TV Visualizer)', () => {

  test('Deve conter o botão de Modo Telão no Admin e abrir a rota de TV com sucesso', async ({ page, context }) => {
    // 1. Acessar o painel do mural utilizando a sessão global persistida do setup
    await page.goto('/admin/mural');
    await page.waitForLoadState('networkidle');

    // 2. Verificar se o botão "📺 Iniciar Modo Telão" foi injetado corretamente
    const tvBtn = page.locator('a:has-text("Iniciar Modo Telão")');
    await expect(tvBtn).toBeVisible({ timeout: 15000 });

    // Extrair o href para validar a composição da URL
    const href = await tvBtn.getAttribute('href');
    expect(href).toContain('/mural/tv?eventId=');

    // 3. Testar comportamento de abertura (Nova aba)
    // Promise para capturar a nova aba após o clique
    const pagePromise = context.waitForEvent('page');
    await tvBtn.click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState();

    // 4. Verificar se a nova página renderizou sem quebrar
    // Deve conter o rodapé com instruções de envio
    const footerInstructions = newPage.locator('text=Envie sua foto ou recado');
    await expect(footerInstructions).toBeVisible({ timeout: 15000 });

    // Deve exibir um QR Code
    const qrImg = newPage.locator('img[alt="QR Code Upload"]');
    await expect(qrImg).toBeVisible();

    console.log('[QA:ModoTelão] Rota de projeção inicializada com sucesso e renderizando QR code dinâmico.');
  });

  test('Deve exibir tela de erro elegante se ID do evento estiver ausente', async ({ page }) => {
    // Tenta acessar a rota sem passar searchParams obrigatórios
    await page.goto('/mural/tv');
    await page.waitForLoadState('networkidle');

    const errorContainer = page.locator('h2:has-text("Erro na Projeção")');
    await expect(errorContainer).toBeVisible({ timeout: 10000 });

    const errorDesc = page.locator('text=ID do Evento ausente na URL');
    await expect(errorDesc).toBeVisible();

    console.log('[QA:ModoTelão] Validação de segurança contra URLs incompletas funcionando.');
  });
});
