module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json'
      }
    ]
  },
  moduleFileExtensions: ['vue', 'ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1'
  },
  modulePaths: ['<rootDir>/src'],
  setupFiles: [
    'jest-canvas-mock',
    './tests/unit/setupTests.ts'
  ],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!(@vue))']
}
