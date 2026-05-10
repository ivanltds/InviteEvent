import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/.auth/user.json';

// STORY-SYNC: Usuário permanente e estável criado e promovido via Supabase MCP para garantir velocidade zero-conf.
const STABLE_EMAIL = 'setup-resilient-1778451741578@test.com';
const STABLE_PASS = 'AdminPassword123!';

setup('authenticate as master admin', async ({ page }) => {
  console.log(`[AuthSetup] Iniciando login ultra-rápido com usuário persistente: ${STABLE_EMAIL}`);

  // 1. Ir direto para a tela de Login (Modo Entrar, não Criar)
  await page.goto('/admin/login');
  
  // Injetar estilos de bypass de overlay para não travar cliques
  await page.addStyleTag({ content: 'nextjs-portal, .nextjs-portal { display: none !important; pointer-events: none !important; }' }).catch(() => {});

  // Auto-dismiss de dialogs inesperados
  page.on('dialog', dialog => dialog.dismiss().catch(() => {}));

  // 2. Preencher credenciais estáveis
  const emailInput = page.getByPlaceholder('E-mail');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  
  await emailInput.fill(STABLE_EMAIL);
  await page.getByPlaceholder('Senha').fill(STABLE_PASS);
  
  // 3. Clicar em Entrar
  await page.getByRole('button', { name: /Entrar/i }).first().click({ force: true });
  console.log(`[AuthSetup] Tentativa de login enviada. Aguardando redirecionamento...`);

  // 4. O login normal redireciona para /admin/dashboard (diferente do onboarding que vai pra /configuracoes)
  // Mas aceitaremos qualquer caminho de administrador que confirme o login bem sucedido.
  await expect(page).toHaveURL(/.*\/admin\/(dashboard|configuracoes).*/, { timeout: 30000 });
  
  await page.waitForLoadState('networkidle');
  console.log(`[AuthSetup] Login bem sucedido. URL atual: ${page.url()}`);

  // 5. Salvar o StorageState para compartilhar entre os testes
  await page.context().storageState({ path: authFile });
  console.log(`[AuthSetup] Sessão armazenada em ${authFile}. Pronto para testes.`);
});
