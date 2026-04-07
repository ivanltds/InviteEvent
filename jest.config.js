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
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'cobertura'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config)
