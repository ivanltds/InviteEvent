module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        target: 'ES2017',
        module: 'commonjs',
        jsx: 'react-jsx',
        allowJs: true,
      },
      useESM: false,
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/src/__tests__/styleMock.js',
  },
  roots: ['<rootDir>/src/'],
  testMatch: [
    '**/src/__tests__/**/*.test.ts',
    '**/src/__tests__/**/*.test.tsx',
    '**/src/lib/services/__tests__/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.simple.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/lib/services/*.ts',
  ],
};
