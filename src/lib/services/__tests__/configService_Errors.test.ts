import { configService } from '../configService';
import { supabase } from '@/lib/supabase';

describe('configService Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  test('updateConfig deve retornar erro se falhar', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'DB Fail' } })
      })
    });

    const res = await configService.updateConfig({});
    expect(res.success).toBe(false);
    expect(res.error?.message).toBe('DB Fail');
  });
});
