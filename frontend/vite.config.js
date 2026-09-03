import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Configure Vite for the WriteSpace React application and its unit tests. */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    globals: true,
  },
});
