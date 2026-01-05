module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|expo-linear-gradient|expo-modules-core|react-native-svg|react-native-maps|react-native-webview|@react-native-async-storage|@react-native-google-signin|@react-native-community|@react-native-clipboard|msw|@mswjs|@ptomasroos|until-async)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  // Force exit to handle worker processes that don't exit cleanly
  forceExit: true,
  // Run tests in a single worker to reduce open handle issues
  maxWorkers: '50%',
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@env$': '<rootDir>/__mocks__/env.js',
    '^expo-linear-gradient$': '<rootDir>/__mocks__/expo-linear-gradient.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.spec.{ts,tsx,js,jsx}',
    '!src/services/dto/**',
    '!src/types/**',
    '!src/models/index.ts',
    '!src/hooks/index.ts',
    '!src/services/mappers/index.ts',
    '!src/utils/mockData.ts',
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  coverageDirectory: 'coverage',
};
