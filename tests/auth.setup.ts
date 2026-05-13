import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/.auth/user.json';

// STORY-SYNC: Usuário permanente e estável agora 100% auto-recuperável no setup E2E para garantir execução em qualquer DB.
const STABLE_EMAIL = 'setup-resilient-1778451741578@test.com';
const STABLE_PASS = 'AdminPassword123!';

setup('authenticate as master admin', async ({ page }) => {
  console.log(`[AuthSetup] Iniciando login ultra-rápido com usuário persistente: ${STABLE_EMAIL}`);

  // 1. Ir direto para a tela de Login
  await page.goto('/admin/login');
  
  // Injetar estilos de bypass de overlay para não travar cliques
  await page.addStyleTag({ content: 'nextjs-portal, .nextjs-portal { display: none !important; pointer-events: none !important; }' }).catch(() => {});

  // Auto-dismiss de dialogs inesperados
  page.on('dialog', dialog => dialog.dismiss().catch(() => {}));

  // 2. Preencher credenciais estáveis
  const emailInput = page.getByPlaceholder('E-mail');
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  
  await emailInput.fill(STABLE_EMAIL);
  await page.getByPlaceholder('Senha').fill(STABLE_PASS);
  
  // 3. Clicar em Entrar
  await page.getByRole('button', { name: /Entrar/i }).first().click({ force: true });
  console.log(`[AuthSetup] Tentativa de login enviada. Aguardando redirecionamento ou verificação de cadastro...`);

  try {
    // Aguarda até 10s pela URL de dashboard ou configurações (indicação de sucesso de login)
    await expect(page).toHaveURL(/.*\/admin\/(dashboard|configuracoes).*/, { timeout: 10000 });
    console.log('[AuthSetup] Login direto bem sucedido.');
  } catch (err) {
    console.log('[AuthSetup] Falha no login direto. O usuário provavelmente não existe no banco local. Iniciando Auto-Sign-up...');
    
    // Navega para a página de cadastro explicitamente
    await page.goto('/admin/login?mode=signup');
    await page.waitForLoadState('networkidle');
    
    // Injeta bypass na página de cadastro
    await page.addStyleTag({ content: 'nextjs-portal, .nextjs-portal { display: none !important; pointer-events: none !important; }' }).catch(() => {});
    
    const nameInput = page.getByPlaceholder('Nome completo');
    await expect(nameInput).toBeVisible({ timeout: 10000 });

    // CPF válido dummy (apenas para contornar a verificação de formato se houver)
    const uniqueCPF = '12345678909';
    
    await nameInput.fill('Master Admin Resiliente');
    await page.getByPlaceholder('CPF').first().fill(uniqueCPF);
    await page.getByPlaceholder('Telefone').fill('11988887777');
    await page.getByPlaceholder('E-mail').fill(STABLE_EMAIL);
    await page.getByPlaceholder('Senha').fill(STABLE_PASS);
    
    console.log('[AuthSetup] Enviando formulário de Cadastro...');
    await page.getByRole('button', { name: /Cadastrar/i }).first().click({ force: true });
    
    // No ambiente local/CI, a confirmação de email é auto-confirmada via migrations
    // Então o app deve nos redirecionar imediatamente para o Painel.
    await expect(page).toHaveURL(/.*\/admin\/(dashboard|configuracoes).*/, { timeout: 30000 });
    console.log('[AuthSetup] Cadastro resiliente efetuado com sucesso!');
  }
  
  await page.waitForLoadState('networkidle');
  console.log(`[AuthSetup] Acesso garantido. URL atual: ${page.url()}`);

  // --- GARANTIA DE EVENTO ATIVO (SELF-HEALING DE DADOS) ---
  // Se o usuário for novo, a listagem de casamentos estará vazia e quebrará testes operacionais.
  // Nós detectamos a ausência de eventos selecionados e forçamos a criação/seleção de um.
  const currentUrl = page.url();
  if (currentUrl.includes('/admin/dashboard')) {
    // Espera um pequeno delay pro EventContext fazer as chamadas API e inicializar os estados
    await page.waitForTimeout(3000);
    
    // O card de eventos usa a classe `card` do CSS module do dashboard
    const firstCard = page.locator('div[class*="card"]').first();
    const hasExistingEvents = await firstCard.isVisible().catch(() => false);
    
    if (hasExistingEvents) {
      console.log('[AuthSetup] Selecionando o primeiro casamento já existente na conta...');
      await firstCard.click();
      await page.waitForTimeout(2000);
    } else {
      // Se não existem eventos, tenta clicar no botão + Criar Novo que é visível no dashboard principal
      const createNewBtn = page.locator('button:has-text("+ Criar Novo")');
      if (await createNewBtn.isVisible().catch(() => false)) {
        console.log('[AuthSetup] Zero eventos detectados. Criando um casamento resiliente de backup...');
        await createNewBtn.click();
        
        const inputNome = page.getByPlaceholder('Ex: Ana e Carlos');
        await expect(inputNome).toBeVisible();
        await inputNome.fill('Casamento de Teste E2E');
        
        await page.locator('button:has-text("Criar")').click();
        console.log('[AuthSetup] Comando de criação enviado. Aguardando...');
        
        // Aguarda o reload e renderização do novo card
        await page.waitForTimeout(4000);
        const newCard = page.locator('div[class*="card"]').first();
        await expect(newCard).toBeVisible({ timeout: 10000 });
        await newCard.click();
        await page.waitForTimeout(2000);
      }
    }
  }

  // Aguarda o localStorage persistir o last_event_id
  await page.waitForTimeout(2000);

  // 5. Salvar o StorageState para compartilhar entre os testes
  // Isso salva os cookies (sb-access-token) E o localStorage (last_event_id)!
  await page.context().storageState({ path: authFile });
  console.log(`[AuthSetup] Sessão estável (com cookies e localStorage) armazenada em ${authFile}.`);
});
