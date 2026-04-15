import { test, expect } from '@playwright/test';

// Nota: Este teste assume que você tem um evento de teste e as variáveis de ambiente configuradas.
test.describe('Mural de Recados - Fluxo Completo', () => {
  const testMessage = `Mensagem de Teste E2E ${Math.random().toString(36).substring(7)}`;
  const testAuthor = 'Robô de Teste';

  test('deve enviar um recado e aparecer após aprovação', async ({ page }) => {
    // 1. Acessar página de convite (usando o slug de teste Marcus & Layslla)
    await page.goto('/inv/marcus-e-layslla-556d'); 
    
    // Rola até a seção do mural
    const muralSection = page.locator('#mural');
    await muralSection.scrollIntoViewIfNeeded();

    // 2. Abrir formulário e enviar recado
    await page.click('button:has-text("Escrever Recado")');
    await page.fill('input[placeholder="Como quer ser identificado?"]', testAuthor);
    await page.fill('textarea[placeholder="Escreva algo do fundo do coração..."]', testMessage);
    await page.click('button:has-text("Enviar Mensagem")');

    // Verifica feedback de sucesso
    await expect(page.locator('text=Mensagem enviada!')).toBeVisible();
    
    // 3. Ir para o Admin moderar (Simulando login se necessário)
    // Nota: Em um ambiente real, usaríamos o auth.setup.ts para já estar logado
    await page.goto('/admin/login');
    // Preencher login (ajuste conforme seu usuário de teste)
    await page.fill('input[type="email"]', 'ivan@google.com'); 
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    // Navegar para o Mural do Admin
    await page.waitForURL('**/admin/dashboard');
    await page.goto('/admin/mural');

    // 4. Localizar o recado e Aprovar
    const messageCard = page.locator(`.card:has-text("${testMessage}")`);
    await expect(messageCard).toBeVisible();
    await messageCard.locator('button:has-text("Aprovar")').click();

    // 5. Voltar ao convite e verificar se apareceu
    await page.goto('/inv/marcus-e-layslla-556d');
    await muralSection.scrollIntoViewIfNeeded();
    
    // O recado agora deve estar no grid público
    await expect(page.locator(`#mural:has-text("${testMessage}")`)).toBeVisible();
    await expect(page.locator(`#mural:has-text("${testAuthor}")`)).toBeVisible();
  });
});
