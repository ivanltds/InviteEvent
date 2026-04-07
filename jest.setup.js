import '@testing-library/jest-dom'

// Mock global do Supabase para todos os testes
const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue({ data: null, error: null }),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => mockQueryBuilder),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

// Mock do fetch global
global.fetch = jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue([]),
});

// Mock do window.matchMedia (comum em testes de UI)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
