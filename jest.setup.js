// Mock de @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Silenciar advertències de console.warn i console.error en tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
