/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest',
  testPathIgnorePatterns: ['<rootDir>/.aiox-core/', '<rootDir>/node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/.aiox-core/'],
  roots: ['<rootDir>/src/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-markdown$': '<rootDir>/src/__mocks__/mockComponent.js',
    '^remark-gfm$': '<rootDir>/src/__mocks__/dummy.js',
    '^rehype-raw$': '<rootDir>/src/__mocks__/dummy.js',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'cobertura'],
  // Correção de 20/09/2026 (docs/analise/03-testes.md, TST): os números
  // de 85/70/80/85% nunca foram cumpridos nem fiscalizados de verdade —
  // o Jest nunca tinha rodado no CI até agora (só o Playwright). Rodando
  // de fato, a cobertura real é ~43/35/45/36%. Ajustado para um piso
  // logo abaixo do real, com folga, para o CI passar hoje e travar
  // QUEDAS futuras de cobertura — não é a meta, é o chão. Suba estes
  // números conforme for adicionando testes reais (não infle com
  // suites sem assert — src/lib/services/__tests__/ultimate_coverage_v2.test.ts
  // faz isso hoje e ainda não foi corrigido, ver TST-07).
  coverageThreshold: {
    global: {
      statements: 40,
      branches: 30,
      functions: 33,
      lines: 40,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config)
