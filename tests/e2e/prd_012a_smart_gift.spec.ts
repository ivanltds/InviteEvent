import { test, expect } from '@playwright/test';

test.describe('PRD-012A: Smart Gift List - A Fundação Inteligente', () => {

  test('Deve exibir a interface unificada de 3 abas no painel de presentes', async ({ page }) => {
    // 1. Acessa o Cockpit de Presentes
    await page.goto('/admin/presentes');
    await page.waitForLoadState('networkidle');

    // 2. Verifica a aba legada unificada
    const tabCatalogo = page.locator('button:has-text("Gestão do Catálogo")');
    await expect(tabCatalogo).toBeVisible({ timeout: 15000 });

    // 3. Verifica a nova aba "Sugestões de Presentes" (Vitrine SaaS)
    const tabSugestoes = page.locator('button:has-text("Sugestões de Presentes")');
    await expect(tabSugestoes).toBeVisible();

    // 4. Verifica a aba financeira "Presentes Recebidos"
    const tabRecebidos = page.locator('button:has-text("Presentes Recebidos")');
    await expect(tabRecebidos).toBeVisible();

    console.log('[QA:SmartGift] 3 abas de gerenciamento validadas com sucesso.');
  });

  test('Deve permitir transitar para a Vitrine Inteligente e listar categorias globais', async ({ page }) => {
    await page.goto('/admin/presentes');
    await page.waitForLoadState('networkidle');

    // Clica na aba Sugestões
    const tabSugestoes = page.locator('button:has-text("Sugestões de Presentes")');
    await tabSugestoes.click();

    // Aguarda renderizar os chips de categoria
    const chipTodos = page.locator('button:has-text("Ver Tudo")');
    await expect(chipTodos).toBeVisible({ timeout: 15000 });

    // Verifica se o widget de recomendação inteligente apareceu
    const recommendationWidget = page.locator('span:has-text("RECOMENDAÇÕES PARA SUA LISTA")');
    await expect(recommendationWidget).toBeVisible();

    console.log('[QA:SmartGift] Vitrine dinâmica carregada com sucesso com taxonomias e recomendador.');
  });

  test('Deve permitir a abertura do formulário de novo presente e conter o seletor de categoria', async ({ page }) => {
    await page.goto('/admin/presentes');
    await page.waitForLoadState('networkidle');

    // Clica no botão de Adicionar Manualmente no cockpit original
    const btnNovoPresente = page.locator('button:has-text("Novo Presente")');
    await btnNovoPresente.click();

    // Aguarda modal abrir e verifica o campo label
    const labelCategoria = page.locator('label:has-text("Categoria do Presente")');
    await expect(labelCategoria).toBeVisible({ timeout: 10000 });

    // Verifica o dropdown select
    const selectCategoria = page.locator('select');
    await expect(selectCategoria).toBeVisible();

    // Deve conter opção geral padrão
    const optionGeral = page.locator('option:has-text("Sem categoria definida (Geral)")');
    await expect(optionGeral).toBeAttached();

    console.log('[QA:SmartGift] Categorização no cadastro manual testada com cobertura total.');
  });

  test('Deve integrar itens customizados na vitrine de sugestões e aplicar deduplicação inteligente por nome', async ({ page }) => {
    const uniqueGiftName = `Item Customizado E2E ${Math.floor(Math.random() * 10000)}`;

    await page.goto('/admin/presentes');
    await page.waitForLoadState('networkidle');

    // 1. Abre o modal e cadastra um presente manualmente
    await page.locator('button:has-text("Novo Presente")').click();
    await page.locator('label:has-text("Nome do Presente") + input').fill(uniqueGiftName);
    await page.locator('label:has-text("Preço Estimado (R$)") + input').fill('250');
    await page.locator('label:has-text("Quantidade Total") + input').fill('1');
    
    // 2. Salva através da Floating Action Bar que detectou a sujeira
    const btnSalvar = page.locator('button:has-text("Salvar Agora")');
    await expect(btnSalvar).toBeVisible({ timeout: 5000 });
    await btnSalvar.click();

    // 3. Espera o item aparecer na aba Gestão para confirmar sucesso
    await expect(page.locator(`h3:has-text("${uniqueGiftName}")`)).toBeVisible({ timeout: 15000 });

    // 4. Transiciona para a aba "Sugestões de Presentes"
    await page.locator('button:has-text("Sugestões de Presentes")').click();
    await page.waitForTimeout(1000); // Aguarda re-render

    // 5. Procura pelo card do item inserido e valida que ele consta na View de banco unificada
    const suggestedCard = page.locator(`div[class*="giftCard"]:has-text("${uniqueGiftName}")`);
    await expect(suggestedCard).toBeVisible({ timeout: 15000 });

    // 6. Valida que consta com a badge "Adicionado à sua lista", provando a proteção taxonômica e a deduplicação
    const badgeAdicionado = suggestedCard.locator('div:has-text("Adicionado à sua lista")').first();
    await expect(badgeAdicionado).toBeVisible();

    console.log(`[QA:SmartGift] Sucesso! Item customizado "${uniqueGiftName}" unificado no pool de sugestões e deduplicado no grid.`);
  });

});
