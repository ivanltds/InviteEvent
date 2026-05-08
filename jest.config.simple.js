module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: false,
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  roots: ['<rootDir>/src/'],
  testMatch: [
    '**/src/__tests__/**/*.test.ts',
    '**/src/lib/services/__tests__/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.simple.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/lib/services/*.ts',
  ],
};
