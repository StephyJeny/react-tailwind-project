import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

if (!window.matchMedia) {
  window.matchMedia = (query) => {
    return {
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  };
}
