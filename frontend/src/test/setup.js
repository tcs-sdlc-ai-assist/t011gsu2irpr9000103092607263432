import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/** Clean up rendered DOM after each test to prevent state leakage. */
afterEach(() => {
  cleanup();
  localStorage.clear();
});
