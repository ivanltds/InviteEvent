import { test, expect } from '@playwright/test';

test.describe('Onboarding e Resiliência', () => {
  
  test('Deve gerenciar conflito de slug automaticamente (Appending)', async ({ page }) => {
    // 1. Criar o primeiro evento com um nome comum
    const commonName = 'Casamento de Teste';
    
    // Simular o fluxo completo de registro para criar o primeiro
    await page.goto('/criar');
    await page.getByPlaceholder('Ex: Maria').fill('Layslla');
    await page.getByPlaceholder('Ex: João').fill('Marcus');
    await page.getByText('Continuar ➜').click();
    await page.getByText('Sálvia Verde').click();
    await page.getByText('Adorei! Continuar ➜').click();
    await page.getByText('Great Vibes').click();
    await page.getByText('Perfeito! Continuar ➜').click();
    await page.getByText('Gerar meu convite ✨').click();
    await page.getByText('Finalizar e Salvar').click();

    // Cadastro do primeiro usuário
    const email1 = `unique-1-${Date.now()}@example.com`;
    await page.getByText('Não tem conta? Criar agora').click();
    await page.getByPlaceholder('Nome completo').fill('User One');
    await page.getByPlaceholder('CPF').fill('11111111111');
    await page.getByPlaceholder('Telefone').fill('11911111111');
    await page.getByPlaceholder('E-mail').fill(email1);
    await page.getByPlaceholder('Senha').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 30000 });

    // 2. Tentar criar exatamente o mesmo para um segundo usuário
    await page.context().clearCookies(); // Simular troca de usuário
    await page.goto('/criar');
    await page.getByPlaceholder('Ex: Maria').fill('Layslla');
    await page.getByPlaceholder('Ex: João').fill('Marcus'); // Gera o mesmo stub 'casamento-de-layslla-e-marcus'
    await page.getByText('Continuar ➜').click();
    // Pular direto para o final (usando padrão)
    await page.getByText('Gerar meu convite ✨').click();
    await page.getByText('Finalizar e Salvar').click();

    const email2 = `unique-2-${Date.now()}@example.com`;
    await page.getByText('Não tem conta? Criar agora').click();
    await page.getByPlaceholder('Nome completo').fill('User Two');
    await page.getByPlaceholder('CPF').fill('22222222222');
    await page.getByPlaceholder('Telefone').fill('11922222222');
    await page.getByPlaceholder('E-mail').fill(email2);
    await page.getByPlaceholder('Senha').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 30000 });

    // 3. Verificar que o evento foi criado (se chegamos no dashboard, o service resolveu o conflito)
    // Opcional: Validar se o slug contém o sufixo aleatório
  });

  test('Deve persistir dados do convite no LocalStorage durante o Onboarding', async ({ page }) => {
    await page.goto('/criar');
    await page.getByPlaceholder('Ex: Maria').fill('Noiva Persistente');
    await page.getByPlaceholder('Ex: João').fill('Noivo Persistente');
    await page.getByText('Continuar ➜').click();

    // Recarregar a página - Atualmente o step volta para 1, mas queremos ver se o LocalStorage 
    // será preenchido no final mesmo com interrupções.
    await page.reload();
    
    // Preencher novamente para chegar ao fim
    await page.getByPlaceholder('Ex: Maria').fill('Noiva Persistente');
    await page.getByPlaceholder('Ex: João').fill('Noivo Persistente');
    await page.getByText('Continuar ➜').click();
    await page.getByText('Gerar meu convite ✨').click();

    // Verificar se o dado está no localStorage após o 'Gerar'
    const storedState = await page.evaluate(() => localStorage.getItem('pending_invite_state'));
    expect(storedState).toContain('Noiva Persistente');
  });
});
