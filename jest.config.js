/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  collectCoverage: true,
  clearMocks: true,
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
};
