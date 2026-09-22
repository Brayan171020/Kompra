export default {
  displayName: 'kompra-api',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: './tsconfig.json' }] },
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  testRegex: '.*\\.spec\\.ts$',
  clearMocks: true,
};
