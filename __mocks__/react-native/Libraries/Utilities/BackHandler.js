// Mock for BackHandler
const mockBackHandler = {
  addEventListener: jest.fn((event, callback) => ({
    remove: jest.fn(),
  })),
  removeEventListener: jest.fn(),
  exitApp: jest.fn(),
};

module.exports = {
  default: mockBackHandler,
  ...mockBackHandler,
};
