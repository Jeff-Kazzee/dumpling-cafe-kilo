import '@testing-library/jest-dom';

// Mock IndexedDB for tests
const mockStorage = new Map<string, unknown>();

global.indexedDB = {
  open: () => ({
    result: {
      objectStoreNames: { contains: () => false },
      createObjectStore: () => ({}),
      transaction: () => ({
        objectStore: () => ({
          get: () => ({ result: null }),
          put: () => ({}),
        }),
      }),
    },
    onsuccess: null,
    onerror: null,
  }),
} as unknown as IDBFactory;

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
  },
  writable: true,
});
