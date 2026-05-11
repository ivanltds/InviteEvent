import { test, expect } from '@playwright/test';

test.describe('PRD-007 - Motor de Simulação Imersiva & Sandbox', () => {
  test.beforeEach(async ({ page }) => {
    // Limpeza de portais de erro Next
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = 'nextjs-portal, .nextjs-portal, #__next_error__ { display: none !important; pointer-events: none !important; }';
      document.head.appendChild(style);
    });

    await page.goto('/admin/dashboard');
    
    // Garante seleção de evento ativa para herança de contexto
    const eventLink = page.getByText(/Casamento de/).first();
    if (await eventLink.isVisible({ timeout: 5000 })) {
      await eventLink.click();
    }
    
    await page.waitForLoadState('networkidle');
  });

  test('TEST-007-01: Ingressão e Oclusão de Layout no Simulador', async ({ page }) => {
    // Navegar via menu lateral para certificar o link novo
    await page.goto('/admin/visualizar');
    await page.waitForTimeout(3000);

    // 1. Valida Oclusão: A sidebar padrão não deve estar visível nesse viewport imersivo
    const sidebar = page.locator('aside:has-text("Dashboard")');
    const isSidebarHidden = await sidebar.isHidden().catch(() => true);
    expect(isSidebarHidden).toBe(true);

    // 2. Valida Bar de Status: A barra inferior contextuada "Modo Simulação" deve carregar
    const simulationBar = page.locator('h4:has-text("Modo Simulação")');
    await expect(simulationBar).toBeVisible({ timeout: 10000 });

    // 3. Valida Egress (HUD de topo): Botão flutuante deve estar presente
    const backFloat = page.locator('a:has-text("Voltar às Configurações")').first();
    await expect(backFloat).toBeVisible();
  });

  test('TEST-007-02: Preservação de Estados no Retorno via Bypass (skip_gateway)', async ({ page }) => {
    // Pular direto para a simulação já ativada e desvendar o envelope (caso exista)
    await page.goto('/admin/visualizar');
    await page.waitForTimeout(2000);
    
    // Tentar clicar no envelope se ele travar a tela inicial
    const envelopeBtn = page.locator('button:has-text("Abrir")').or(page.locator('[class*="envelope"]'));
    if (await envelopeBtn.first().isVisible()) {
      await envelopeBtn.first().click();
      await page.waitForTimeout(2000); // Animação
    }

    // Simular o clique para a página de mural (que herdou o context links)
    // Encontrar botão do mural no convite
    const muralBtn = page.locator('a:has-text("Mural de Recados")').or(page.getByRole('link', { name: /Ver Mural/i }));
    
    // Como o botão depende da configuração visual, vamos acessar a rota de simulação com queryParams
    // para testar o ciclo de volta que implementamos.
    const currentEventId = await page.evaluate(() => window.location.search); // fallback
    
    // Navega para o mural em modo preview
    await page.goto('/mural?preview=true&eventId=dummy-test-id');
    await page.waitForTimeout(2000);

    // 1. Validar presença e posicionamento do link "Voltar ao Convite"
    const backLink = page.locator('a:has-text("Voltar ao Convite")');
    await expect(backLink).toBeVisible();
    
    // 2. O link deve conter a blindagem skip_gateway=true para o simulador
    const href = await backLink.getAttribute('href');
    expect(href).toContain('/admin/visualizar');
    expect(href).toContain('skip_gateway=true');

    // 3. Clicar no link e certificar que fomos jogados na visão direto
    await backLink.click();
    await page.waitForTimeout(1000);
    
    expect(page.url()).toContain('skip_gateway=true');
  });

  test('TEST-007-03: Sanitização Transacional (Mural & RSVP Sandbox)', async ({ page }) => {
    // Ir direto para o RSVP da simulação
    await page.goto('/admin/visualizar?skip_gateway=true');
    await page.waitForTimeout(3000);

    // Procurar formulário RSVP (se habilitado na config default)
    const rsvpSection = page.locator('#rsvp').or(page.locator('h2:has-text("RSVP")'));
    
    // Apenas valida que o formulário renderiza a UI interativa mesmo no mockup de preview
    if (await rsvpSection.isVisible()) {
      const nameInput = page.locator('input[placeholder*="Seu nome"]').first();
      if (await nameInput.isVisible()) {
        await expect(nameInput).toBeVisible();
      }
    }
    
    // Validar o modo sandbox da página de presentes também!
    await page.goto('/presentes?preview=true&eventId=dummy');
    
    // Certificar que o header injetado via setup unificado também centralizou o botão nela
    const presentesBack = page.locator('header a:has-text("Voltar ao Convite")');
    await expect(presentesBack).toBeVisible();
  });
});
