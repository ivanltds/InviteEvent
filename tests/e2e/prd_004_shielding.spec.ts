import { test, expect, devices, Page } from '@playwright/test';

// Auxiliar Robusto para desativar o "Modo Operacional" e voltar para listagem de plataforma.
async function goToPlatformMode(page: Page) {
  // 1. Ir para a rota que exibe o Dashboard
  if (!page.url().includes('/admin/dashboard')) {
    await page.goto('/admin/dashboard');
  }
  
  // Pequeno delay para garantir hidratação inicial da barra lateral
  await page.waitForTimeout(1000);

  // 2. O elemento definitive para alternar contexto é o '[class*="activeEvent"]'
  const switcher = page.locator('[class*="activeEvent"]').first();
  
  // Verificar se o H1 já diz "Meus Casamentos". Se disser, já estamos na plataforma!
  const h1Text = await page.locator('h1').first().innerText().catch(() => "");
  if (h1Text.includes("Meus Casamentos")) {
      console.log("Já na visualização de Plataforma.");
      return;
  }

  // Se não diz Meus Casamentos, assumimos modo operacional. Clicamos no switcher lateral para sair!
  console.log("Modo Operacional detectado. Tentando clicar no contexto para alternar...");
  
  // Usamos count() que é síncrono e imediato para decidir se tentamos clicar.
  if (await switcher.count() > 0) {
      // Tenta clicar. Se estiver oculto ou invisível por viewport mobile, forçamos o click para acionar o handler react.
      await switcher.click({ force: true }).catch(() => console.log("Clique no Switcher falhou."));
  }

  // Validar sucesso definitivo
  await expect(page.locator('h1').first()).toContainText(/Meus Casamentos/i, { timeout: 10000 });
}

test.describe('Blindagem PRD-004: Estabilidade UX e RBAC', () => {
  
  test.beforeEach(async ({ page }) => {
    // Garantir isolamento de Viewport gigantesco por padrão
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = 'nextjs-portal, .nextjs-portal { display: none !important; pointer-events: none !important; }';
      document.head.appendChild(style);
    });
  });

  test('CENÁRIO 1: Integridade do Container Query (Preview Isolado)', async ({ page }) => {
    await page.goto('/admin/configuracoes');
    
    const previewRoot = page.locator('.disable-interactions');
    await expect(previewRoot).toBeVisible({ timeout: 20000 });

    const historiaTitle = page.locator('section#historia h2').first();
    await expect(historiaTitle).toBeVisible();
    
    const fontSize = await historiaTitle.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('font-size');
    });

    const numericFontSize = parseFloat(fontSize);
    console.log(`[CENARIO 1] Font size: ${fontSize}`);
    
    expect(numericFontSize).toBeLessThan(60);
    expect(numericFontSize).toBeGreaterThan(10);
  });

  test('CENÁRIO 2: Blindagem de Z-Index & Scroll no iPhone SE', async ({ page }) => {
    await page.setViewportSize(devices['iPhone SE'].viewport);
    await page.goto('/admin/dashboard');

    // Abrir menu burger móvel
    const menuBtn = page.locator('button[class*="hamburger"], button[class*="toggleMenu"]').first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(400);
    }

    // Seletor real no adminLayout wrapper
    const wrapperLocator = page.locator('div[class*="sidebarWrapper"]').first();
    await expect(wrapperLocator).toBeVisible();

    const zIndexStr = await wrapperLocator.evaluate((el) => window.getComputedStyle(el).getPropertyValue('z-index'));
    console.log(`[CENARIO 2] Z-Index: ${zIndexStr}`);
    
    expect(parseInt(zIndexStr, 10)).toBeGreaterThanOrEqual(9999);

    // Verificar botão flutuante/inferior no mobile
    const logoutBtn = page.getByRole('button', { name: /Sair da Conta/i }).first();
    await logoutBtn.scrollIntoViewIfNeeded();
    await expect(logoutBtn).toBeVisible();
  });

  test('CENÁRIO 3A: RBAC Check - Proprietário Natural', async ({ page }) => {
    // O usuário do auth setup é Owner. Devemos ver os botões de ação na plataforma.
    await goToPlatformMode(page);

    const editBtn = page.locator('button[class*="miniEditBtn"]').first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
  });

  test('CENÁRIO 3B: RBAC Check - Restrição de Equipe (Mock Staff)', async ({ page }) => {
    // ATENÇÃO: Para o Mock persistir na primeira renderização, ele DEVE ser declarado ANTES de qualquer `page.goto` ou `goToPlatformMode`
    
    // 1. MOCK ROLE: FORÇAR role para "organizador" no vínculo com os eventos
    await page.route('**/rest/v1/evento_organizadores?**', async route => {
      const response = await route.fetch();
      const json = await response.json();
      const mockedJson = Array.isArray(json) ? json.map((item: any) => ({ ...item, role: 'organizador' })) : [];
      await route.fulfill({ json: mockedJson });
      console.log("[MOCK STAFF] Resposta da API substituída por organizador.");
    });

    // 2. MOCK PROFILE: FORÇAR is_master: false para que o RBAC não considere o usuário um Master global!
    await page.route('**/rest/v1/perfis?**', async route => {
      const response = await route.fetch();
      const json = await response.json();
      const mockedJson = Array.isArray(json) ? json.map((item: any) => ({ ...item, is_master: false })) : [];
      await route.fulfill({ json: mockedJson });
      console.log("[MOCK STAFF] Privilégios Master removidos temporariamente do perfil.");
    });

    // Agora entramos na página com todos os Mocks já armadilhados
    await goToPlatformMode(page);
    
    // A página deve renderizar com as Roles mockadas
    const ghostEditBtn = page.locator('button[class*="miniEditBtn"]');
    const ghostDeleteBtn = page.locator('button[class*="miniDeleteBtn"]');
    
    // CRITÉRIO DE BLINDAGEM: Botões deletar/editar NUNCA aparecem para equipe na plataforma unificada
    await expect(ghostEditBtn).toHaveCount(0);
    await expect(ghostDeleteBtn).toHaveCount(0);
    
    // Tag informativa de permissão
    const roleTag = page.locator('[class*="roleTag"]');
    await expect(roleTag.first()).toBeVisible();
    await expect(roleTag.first()).toContainText(/Equipe/i);
  });

  test('CENÁRIO 4: Isolamento de Eventos (Stop Propagation na Lixeira)', async ({ page }) => {
    await goToPlatformMode(page);

    const deleteBtn = page.locator('[class*="miniDeleteBtn"]').first();
    await expect(deleteBtn).toBeVisible({ timeout: 10000 });

    // Supressão de dialog para manter a UI estável
    page.once('dialog', async dialog => {
      await dialog.dismiss(); 
    });

    const originalUrl = page.url();
    
    // Teste central: O clique no botão de delete NÃO PODE causar o click no card ancestral,
    // que dispararia a navegação para o dashboard operacional.
    await deleteBtn.click();
    
    // Aguardar brevemente para ter certeza de que NENHUMA navegação indesejada ocorreu
    await page.waitForTimeout(1000);

    // Validar imutabilidade de URL
    expect(page.url()).toBe(originalUrl);
    await expect(page.locator('main h1').first()).toContainText(/Meus Casamentos/i);
  });

  test('CENÁRIO 5: Fluxo Bidirecional de Chat Mobile (WhatsApp Style)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    
    // 1. Injetar Dados de Ticket via API INTERNA Mockada (usada pelo componente)
    await page.route('**/api/support/tickets**', async route => {
      await route.fulfill({
        json: {
          success: true,
          tickets: [
            { 
              id: 'qa-tk-999', 
              status: 'aguardando_atendimento', 
              created_at: new Date().toISOString(), 
              usuario_id: 'xxx',
              nome_usuario: 'QA Cliente Mock',
              email_usuario: 'qa@mock.com'
            }
          ]
        }
      });
    });

    await page.goto('/admin/suporte');
    
    // Aguardar o painel carregar
    await expect(page.locator('h1').first()).toContainText(/Painel de Atendimento/i, { timeout: 20000 });

    // O seletor 'sidebar' pode colidir com a Sidebar GLOBAL do painel admin.
    // Filtramos pelo texto exclusivo "Chamados Ativos" para pegar especificamente a do Chat.
    const listSidebar = page.locator('div[class*="sidebar"]').filter({ hasText: /Chamados Ativos/i }).first();
    
    // ESTADO A: Lista visível no mobile por padrão (sem ticket selecionado)
    await expect(listSidebar).toBeVisible();

    // Interação: Clicar no ticket injetado pelo Mock. O card tem classe 'ticketCard'
    const ticketEntry = page.locator('[class*="ticketCard"]').first();
    await expect(ticketEntry).toBeVisible({ timeout: 10000 });
    
    // Clique para abrir o chat
    await ticketEntry.click();

    // ESTADO B: Mobile Single Column View ativa! A lista de tickets deve SUMIR no mobile via CSS se tiver seleção!
    // (No CSS do suporte.module.css, na classe .layout.hasSelection o mobile oculta a sidebar)
    await expect(listSidebar).toBeHidden({ timeout: 5000 }); 
    
    // Deve haver um botão Voltar no cabeçalho do chat agora
    const backButton = page.locator('button[class*="backButton"]').first();
    await expect(backButton).toBeVisible();

    // Interação: Clicar para Voltar
    await backButton.click();
    
    // ESTADO C: Retorno triunfal à lista (sidebar volta a aparecer)
    await expect(listSidebar).toBeVisible();
  });
});
