import { authService } from '../authService';

describe('authService (TDD)', () => {
  const MOCK_PASSWORD = 'password123';
  
  beforeAll(() => {
    process.env.ADMIN_PASSWORD = MOCK_PASSWORD;
  });

  it('deve validar a senha corretamente', async () => {
    const success = await authService.login(MOCK_PASSWORD);
    expect(success).toBe(true);
  });

  it('deve rejeitar senha incorreta', async () => {
    const success = await authService.login('senha_errada');
    expect(success).toBe(false);
  });

  it('deve retornar falso se a variável de ambiente não estiver configurada', async () => {
    const original = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    
    const success = await authService.login(MOCK_PASSWORD);
    expect(success).toBe(false);
    
    process.env.ADMIN_PASSWORD = original;
  });
});
