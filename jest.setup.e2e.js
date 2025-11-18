// Setup específic per tests E2E
// No fem mock de Firebase perquè necessitem la implementació real amb l'emulador

// Mock de @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Silenciar advertències de console en tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
