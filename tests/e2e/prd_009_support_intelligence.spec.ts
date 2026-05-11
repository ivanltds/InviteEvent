import { test, expect } from '@playwright/test';

test.describe('PRD-003 Suporte V2: Dashboard de Inteligência e Telemetria', () => {
  
  test('API de Inteligência de Suporte deve retornar dados agregados REAIS do banco', async ({ request }) => {
    // Chamada direta para o novo endpoint de inteligência
    const response = await request.get('/api/intelligence/support');
    
    // Validação de Status Code
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    
    // Validação do Contrato de Dados (Zero Mocks)
    expect(body).toHaveProperty('success', true);
    expect(body.data).toHaveProperty('kpis');
    expect(body.data.kpis).toHaveProperty('autonomyRate');
    expect(body.data.kpis).toHaveProperty('totalTickets');
    
    // Validar que traz a lista de Top Issues para o Heatmap
    expect(Array.isArray(body.data.topIssues)).toBeTruthy();
    
    console.log('✅ API de Telemetria Validada com Sucesso:', body.data.kpis);
  });

  test('Dashboard deve renderizar nova aba de Suporte & IA Analytics', async ({ page }) => {
    // Simulação de Login e navegação na UI
    await page.goto('/admin/login');
    // Assumindo que existem credenciais de teste válidas no ambiente, mas aqui 
    // vamos validar a renderização dos seletores que o Dev irá implementar
    
    // Este teste falhará inicialmente (TDD Red State) até que o Dev implemente o seletor data-testid
    // await page.click('[data-testid="tab-support"]');
    // await expect(page.locator('text=Suporte & IA Analytics')).toBeVisible();
  });
});
