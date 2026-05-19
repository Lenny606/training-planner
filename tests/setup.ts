import '@testing-library/jest-dom';
import 'fake-indexeddb/auto'; // Mockování IndexedDB pro Dexie v testech

// Mockování navigator.onLine pro testování offline scénářů
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});
