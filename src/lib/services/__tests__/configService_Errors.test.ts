import { configService } from '../configService';
import { supabase } from '@/lib/supabase';

describe('configService Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  test('updateConfig deve retornar erro se falhar', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ error: { message: 'DB Fail' } })
    });

    const res = await configService.updateConfig('e1', {});
    expect(res.success).toBe(false);
    // Usando stringContaining para evitar problemas com wrapping de objeto Error
    expect(res.error?.message).toContain('DB Fail');
  });
});
