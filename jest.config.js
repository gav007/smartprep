
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  // Add more setup options before each test is run
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
 },
  // Optionally specify transform for ts/tsx files
   transform: {
     '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
   },
   // Ignore specific paths if needed (e.g., utility files not meant for testing directly)
   // testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
   // transformIgnorePatterns: [
   //   '/node_modules/',
   //   '^.+\\.module\\.(css|sass|scss)$',
   // ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
