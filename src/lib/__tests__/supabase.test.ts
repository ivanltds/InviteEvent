import { supabase } from '../supabase';

describe('Supabase Client Lib', () => {
  test('deve exportar instância definida do Supabase', () => {
    expect(supabase).toBeDefined();
    expect(supabase.from).toBeDefined();
  });

  test('deve permitir chamar métodos básicos do cliente', async () => {
    const { data, error } = await supabase.from('test').select('*').maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});
