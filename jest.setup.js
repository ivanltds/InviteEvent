import '@testing-library/jest-dom'

const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act(...)')) return;
  originalError.call(console, ...args);
};

// FACTORY para mocks de query builder para evitar vazamento de estado entre testes
const createMockQueryBuilder = () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockImplementation((fn) => {
      return Promise.resolve(fn({ data: [], error: null }));
    }),
  };
  return chain;
};

// Mock global do Supabase para todos os testes
const mockSupabase = {
  from: jest.fn(() => createMockQueryBuilder()),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  }
};

// Mock de AMBOS para garantir cobertura (biblioteca e instância local)
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock do fetch global
global.fetch = jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue([]),
});

// Mock do window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Vercel Analytics
jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}));

// Mock do useRouter do Next
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
  useParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => ''),
}));
