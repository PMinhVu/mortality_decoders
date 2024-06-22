/* eslint-disable no-undef */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dsv from '@rollup/plugin-dsv'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dsv()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@assets': path.resolve(__dirname, './src/assets')
    },
  },
});
