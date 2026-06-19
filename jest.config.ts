import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|scss|sass)$': '<rootDir>/__mocks__/styleMock.ts',
    '\\.(png|jpg|jpeg|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc/jest', {
      jsc: {
        transform: {
          react: { runtime: 'automatic' },
        },
      },
    }],
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lib/**/*.ts',
    'components/**/*.tsx',
    '!**/*.d.ts',
    '!**/ui/**',
  ],
}

export default config
