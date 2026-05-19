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
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
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
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  })),
  removeChannel: jest.fn().mockResolvedValue(true),
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

// Mock do IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Mock Vercel Analytics
jest.mock('@vercel/analytics/next', () => ({
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

// Fix ESM SyntaxError: Unexpected token 'export' in react-markdown
jest.mock('react-markdown', () => {
  return function MockMarkdown({ children }) {
    return <div>{children}</div>;
  };
});

// Robust Mock Chart.js
jest.mock('chart.js', () => {
  const ChartMock = {
    register: jest.fn(),
    defaults: {
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true }
      }
    }
  };
  return {
    Chart: ChartMock,
    register: jest.fn(), // direct export support
    CategoryScale: jest.fn(),
    LinearScale: jest.fn(),
    BarElement: jest.fn(),
    PointElement: jest.fn(),
    LineElement: jest.fn(),
    ArcElement: jest.fn(),
    Title: jest.fn(),
    Tooltip: jest.fn(),
    Legend: jest.fn(),
    Filler: jest.fn(),
  };
});

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart" />,
  Doughnut: () => <div data-testid="mock-doughnut-chart" />,
  Line: () => <div data-testid="mock-line-chart" />,
}));

// Mock global canvas-confetti to prevent context canvas errors in JSDOM
jest.mock('canvas-confetti', () => {
  const mockConfetti = jest.fn(() => Promise.resolve());
  mockConfetti.create = jest.fn(() => mockConfetti);
  return mockConfetti;
});
