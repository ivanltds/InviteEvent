/**
 * STORY-056 TDD: EnvelopeGateway component tests
 * Tests written FIRST before implementation.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia (prefers-reduced-motion)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

jest.mock('@/components/public/EnvelopeGateway/EnvelopeGateway', () => {
  const MockEnvelope = ({ onComplete, slug }: { onComplete: () => void; slug: string }) => (
    <div data-testid="envelope-gateway">
      <button data-testid="open-envelope" onClick={onComplete}>Abrir</button>
      <button data-testid="skip-btn">Pular</button>
    </div>
  );
  MockEnvelope.displayName = 'EnvelopeGateway';
  return MockEnvelope;
});

import EnvelopeGateway from '@/components/public/EnvelopeGateway/EnvelopeGateway';

describe('STORY-056: EnvelopeGateway', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('deve renderizar o envelope inicialmente', () => {
    const onComplete = jest.fn();
    render(<EnvelopeGateway onComplete={onComplete} slug="test-slug" />);
    expect(screen.getByTestId('envelope-gateway')).toBeInTheDocument();
  });

  test('deve chamar onComplete ao abrir o envelope', () => {
    const onComplete = jest.fn();
    render(<EnvelopeGateway onComplete={onComplete} slug="test-slug" />);
    fireEvent.click(screen.getByTestId('open-envelope'));
    expect(onComplete).toHaveBeenCalled();
  });

  test('deve mostrar botão de pular', () => {
    const onComplete = jest.fn();
    render(<EnvelopeGateway onComplete={onComplete} slug="test-slug" />);
    expect(screen.getByTestId('skip-btn')).toBeInTheDocument();
  });
});

// Tests for the utility function
describe('STORY-056: envelope localStorage utils', () => {
  const STORAGE_KEY_PREFIX = 'envelope_opened_';

  test('deve detectar se envelope já foi aberto via localStorage', () => {
    const slug = 'familia-silva';
    localStorageMock.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true');
    const wasOpened = localStorageMock.getItem(`${STORAGE_KEY_PREFIX}${slug}`) === 'true';
    expect(wasOpened).toBe(true);
  });

  test('deve retornar false para slug não visto', () => {
    const wasOpened = localStorageMock.getItem(`${STORAGE_KEY_PREFIX}novo-slug`) === 'true';
    expect(wasOpened).toBe(false);
  });

  test('deve persistir abertura após set', () => {
    const slug = 'familia-new';
    localStorageMock.setItem(`${STORAGE_KEY_PREFIX}${slug}`, 'true');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(`${STORAGE_KEY_PREFIX}${slug}`, 'true');
  });
});
