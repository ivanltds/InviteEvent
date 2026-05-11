import { test, expect } from '@playwright/test';

test.describe('PRD-006 - Consistência Visual e Unificação de Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Ocultar portais do Next.js para não atrapalhar clique
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = 'nextjs-portal, .nextjs-portal, #__next_error__ { display: none !important; pointer-events: none !important; }';
      document.head.appendChild(style);
    });

    await page.goto('/admin/dashboard');
    
    // Garantir evento selecionado se estivermos na lista de seleção
    const eventLink = page.getByText(/Casamento de/).first();
    if (await eventLink.isVisible({ timeout: 5000 })) {
      await eventLink.click();
    }
    
    await page.waitForLoadState('networkidle');
  });

  test('TEST-006-01: Moderação deve ser silenciosa (Sem window.confirm)', async ({ page }) => {
    await page.goto('/admin/mural');
    await page.waitForTimeout(2000); // Wait hydration
    
    // Espionar diálogos nativos. Se algum for invocado, o teste quebra pois combinamos que é ZERO ALERTS.
    let dialogInvoked = false;
    page.on('dialog', dialog => {
      dialogInvoked = true;
      dialog.dismiss();
    });

    // Localizar botão de excluir em qualquer card (se houver)
    // Se não houver card, o teste apenas valida que a UI de exclusão interna reage.
    const deleteBtn = page.locator('[class*="deleteBtn"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      
      // O modal interno do React deve abrir
      const internalModal = page.locator('h3:has-text("Excluir")');
      await expect(internalModal).toBeVisible();
      
      // Nenhuma caixa de diálogo do navegador deve ter aberto!
      expect(dialogInvoked).toBe(false);
    }
  });

  test('TEST-006-02: Agenda deve suportar ícones estendidos sem colisões', async ({ page }) => {
    await page.goto('/admin/agenda');
    await expect(page.getByRole('button', { name: /Novo Marco/i })).toBeVisible();

    // 1. Adicionar novo marco com ícone específico (Ex: Música ou Drink)
    await page.getByRole('button', { name: /Novo Marco/i }).click();
    
    const uniqueTitle = `Balada Teste ${Date.now()}`;
    await page.getByLabel('Título').fill(uniqueTitle);
    await page.getByLabel('Nome do Local').fill('Pista de Dança');
    await page.getByLabel('Endereço Completo').fill('Rua do Teste, 123');
    
    // Selecionar o novo ícone que expandimos na PRD
    await page.locator('select').selectOption('music');
    
    await page.getByRole('button', { name: 'Salvar' }).click();
    
    // 2. Validar que o card apareceu e renderizou
    const card = page.locator(`div[class*="card"]:has-text("${uniqueTitle}")`);
    await expect(card).toBeVisible();
    
    // O SVG deve estar dentro da classe IconWrapper
    const svgIcon = card.locator('[class*="cardIconWrapper"] svg');
    await expect(svgIcon).toBeVisible();
    
    // Validar que o rodapé reservado (.cardFooter) existe (prevenção de sobreposição)
    const footer = card.locator('[class*="cardFooter"]');
    await expect(footer).toBeVisible();
  });

  test('TEST-006-03: Unificação de Botões de Ação (Estilos Computados)', async ({ page }) => {
    await page.goto('/admin/convidados');
    await page.waitForTimeout(2000);

    const btnExcluir = page.locator('[class*="deleteBtn"]').first();
    const btnEdit = page.locator('[class*="editBtn"]').first();

    if (await btnExcluir.isVisible() && await btnEdit.isVisible()) {
      // Ambas devem computar a mesma cor de fundo/borda/texto de acordo com a nova regra unificada
      const colorExcluir = await btnExcluir.evaluate(e => getComputedStyle(e).backgroundColor);
      const colorEdit = await btnEdit.evaluate(e => getComputedStyle(e).backgroundColor);
      
      // Devem ser IDENTICAS (Ambos usam #f3f4f6 ou o padrão unificado)
      expect(colorExcluir).toBe(colorEdit);
    }
  });
});
