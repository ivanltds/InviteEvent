import { supabase } from '@/lib/supabase';

/**
 * Intelligent Mock Factory V9.0
 * Features:
 * - Unified Queue for .from() AND .rpc()
 * - Sticky Defaults.
 */
export const setupSupabaseMock = () => {
  const responses: any[] = [];
  
  const createMockChain = (): any => {
    const chain = {
      select: jest.fn().mockImplementation(() => chain),
      insert: jest.fn().mockImplementation(() => chain),
      update: jest.fn().mockImplementation(() => chain),
      delete: jest.fn().mockImplementation(() => chain),
      upsert: jest.fn().mockImplementation(() => chain),
      eq: jest.fn().mockImplementation(() => chain),
      neq: jest.fn().mockImplementation(() => chain),
      in: jest.fn().mockImplementation(() => chain),
      not: jest.fn().mockImplementation(() => chain),
      or: jest.fn().mockImplementation(() => chain),
      match: jest.fn().mockImplementation(() => chain),
      gt: jest.fn().mockImplementation(() => chain),
      is: jest.fn().mockImplementation(() => chain),
      single: jest.fn().mockImplementation(() => chain),
      maybeSingle: jest.fn().mockImplementation(() => chain),
      order: jest.fn().mockImplementation(() => chain),
      limit: jest.fn().mockImplementation(() => chain),
      then: (resolve: any) => {
        const res = responses.shift() || { data: [], error: null };
        return Promise.resolve(resolve(res));
      }
    };
    return chain;
  };

  (supabase.from as jest.Mock).mockImplementation(() => createMockChain());
  (supabase.rpc as jest.Mock).mockImplementation(() => {
    const res = responses.shift() || { data: { success: true }, error: null };
    return Promise.resolve(res);
  });

  return {
    _responses: responses,
    _pushResponse: (data: any, error: any = null) => responses.push({ data, error }),
    _unshiftResponse: (data: any, error: any = null) => responses.unshift({ data, error }),
  };
};
