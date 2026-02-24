// Jest setup file for React Native Testing Library

// Manual AsyncStorage mock (avoids Expo import scope issues)
const asyncStorageStore = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key) => Promise.resolve(asyncStorageStore[key] || null)),
    setItem: jest.fn((key, value) => {
      asyncStorageStore[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key) => {
      delete asyncStorageStore[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(asyncStorageStore).forEach(key => delete asyncStorageStore[key]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(asyncStorageStore))),
    multiGet: jest.fn((keys) =>
      Promise.resolve(keys.map(key => [key, asyncStorageStore[key] || null]))
    ),
    multiSet: jest.fn((pairs) => {
      pairs.forEach(([key, value]) => { asyncStorageStore[key] = value; });
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys) => {
      keys.forEach(key => delete asyncStorageStore[key]);
      return Promise.resolve();
    }),
  },
}));

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock React Native modules that may be imported
jest.mock('react-native', () => ({
  Platform: { OS: 'android', select: jest.fn((obj) => obj.android) },
  StyleSheet: { create: (styles) => styles },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  ActivityIndicator: 'ActivityIndicator',
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  Alert: { alert: jest.fn() },
}));

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  },
}));

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Define React Native globals
global.__DEV__ = true;

// Set test environment variables
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.ANTHROPIC_API_KEY = 'test-api-key';
