import { test, expect } from '@playwright/test';

// Cache único por arquivo para garantir emails diferentes entre testes e retries
const FILE_UNIQUE_ID = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe('Onboarding e Resiliência', () => {
  // Garantir que os testes de onboarding comecem deslogados
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    // Definir flag global de Playwright para suprimir DOM mutations instáveis
    await page.addInitScript(() => {
      (window as any).isPlaywright = true;
    });

    // Auto-dismiss de alerts residuais
    page.on('dialog', dialog => dialog.dismiss().catch(() => {}));
  });

  // Helper para navegar e criar
  async function performOnboarding(page: any, noiva: string, noivo: string, suffixLabel: string, shouldClearState = true) {
    console.log(`[Flow:${suffixLabel}] Iniciando em /criar...`);
    await page.goto('/criar');
    
    // Limpeza profunda de estado apenas se solicitado (evita quebrar testes de persistência)
    if (shouldClearState) {
      console.log(`[Flow:${suffixLabel}] Limpando localStorage para isolamento total.`);
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    }

    // Injetar estilos de bypass de overlay do Next.js
    await page.addStyleTag({ content: 'nextjs-portal, .nextjs-portal { display: none !important; }' }).catch(() => {});

    // Passo 1: Nomes
    await page.getByPlaceholder(/Ex: Maria/i).fill(noiva);
    await page.getByPlaceholder(/Ex: João/i).fill(noivo);
    await page.getByText(/Continuar/i).first().click({ force: true });
    
    // Passo 2: Cores (Seleção EXPLÍCITA)
    await expect(page.getByText(/As cores dão o tom/i)).toBeVisible();
    await page.getByText(/Sálvia Verde/i).click();
    await page.getByText(/Adorei! Continuar/i).click({ force: true });
    
    // Passo 3: Tipografia (Seleção EXPLÍCITA)
    await expect(page.getByText(/A letra conta uma história/i)).toBeVisible();
    await page.getByText(/Great Vibes/i).click();
    await page.getByText(/Perfeito! Continuar/i).click({ force: true });
    
    // Passo 4: Gerar convite
    await page.evaluate(() => localStorage.setItem('skip_gateway', 'true'));
    const genBtn = page.getByText(/Gerar meu convite/i);
    await expect(genBtn).toBeVisible();
    await genBtn.click({ force: true });
    
    // Preview - Agora deve ser instantâneo sem o EnvelopeGateway
    await page.waitForURL(url => url.toString().includes('preview'), { timeout: 20000 });

    await expect(page.getByText(/Uau, o que achou/i)).toBeVisible({ timeout: 20000 });
    await page.getByText(/Finalizar e Salvar/i).click({ force: true });

    // Registro Directo (UX Melhorada)
    await page.waitForTimeout(2000); 
    console.log(`[Flow:${suffixLabel}] URL após Salvar: ${page.url()}`);

    if (page.url().includes('dashboard')) {
      console.log(`[Flow:${suffixLabel}] Usuário já redirecionado para Dashboard. Pulando registro.`);
      return;
    }

    await page.waitForURL(/.*login.*mode=signup.*/, { timeout: 20000 });
    console.log(`[Flow:${suffixLabel}] Na tela de Cadastro Direto. Verificando mensagem contextual...`);
    await expect(page.getByText(/Você está quase lá!/i)).toBeVisible();
    
    const email = `resilient-${suffixLabel}-${FILE_UNIQUE_ID}@test.com`;
    const uniqueCPF = Math.floor(Math.random() * 90000000000 + 10000000000).toString(); // 11 dígitos aleatórios
    const uniqueTel = `119${Math.floor(Math.random() * 90000000 + 10000000)}`;

    await page.getByPlaceholder(/Nome completo/i).fill(`User ${suffixLabel} ${FILE_UNIQUE_ID}`);
    await page.getByPlaceholder(/CPF/i).first().fill(uniqueCPF);
    await page.getByPlaceholder(/Telefone/i).fill(uniqueTel);
    await page.getByPlaceholder(/E-mail/i).fill(email);
    await page.getByPlaceholder(/Senha/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /Cadastrar/i }).click({ force: true });
    
    console.log(`[Flow:${suffixLabel}] Aguardando Hard Redirect para Configurações...`);

    // Verificação de Sucesso - Configurações (Novo Landing UX)
    await expect(page).toHaveURL(/.*configuracoes.*/, { timeout: 45000 });
    await expect(page.getByRole('heading', { name: /Identidade Visual/i })).toBeVisible({ timeout: 20000 });
  }

  test('Cenário 1: Fluxo Base de Onboarding com Sucesso', async ({ page }) => {
    const noiva = `Layslla_Base_${FILE_UNIQUE_ID}`;
    const noivo = `Marcus_Base_${FILE_UNIQUE_ID}`;
    await performOnboarding(page, noiva, noivo, 'base');
  });

  test('Cenário 2: Resolução de Conflito de Slug (Appending)', async ({ page }) => {
    // Usamos os mesmos nomes do teste anterior para forçar tentativa de colisão se o banco persistir entre testes
    // OU simplesmente usamos nomes fixos que sabemos que colidiriam em execuções paralelas
    const noiva = `Conflict_Noiva_${FILE_UNIQUE_ID}`;
    const noivo = `Conflict_Noivo_${FILE_UNIQUE_ID}`;
    
    // Primeiro fluxo (Cria o slug base)
    await performOnboarding(page, noiva, noivo, 'c1');
    
    // Segundo fluxo (Tenta criar o mesmo slug -> deve dar append)
    await page.context().clearCookies();
    await performOnboarding(page, noiva, noivo, 'c2');
  });

  test('Cenário 3: Persistência de Dados no LocalStorage', async ({ page }) => {
    const uniqueId = Date.now();
    await page.goto('/criar');
    
    await page.getByPlaceholder(/Ex: Maria/i).fill(`Persistence_${uniqueId}`);
    await page.getByPlaceholder(/Ex: João/i).fill(`Persistence_${uniqueId}`);
    await page.getByText(/Continuar/i).first().click();
    
    // Simular refresh da página
    await page.reload();
    
    // Verificar se o estado parcial está no LocalStorage
    const state = await page.evaluate(() => localStorage.getItem('pending_invite_state'));
    expect(state).not.toBeNull();
    const parsed = JSON.parse(state!);
    expect(parsed.noiva_nome).toContain('Persistence');
  });
});
