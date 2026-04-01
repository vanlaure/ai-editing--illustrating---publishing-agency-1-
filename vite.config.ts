import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(({ mode }) => {
    loadEnv(mode, '.', '');
    return {
      server: {
        // changed from 3000 to 4001 to avoid conflict with another local app
        port: 4001,
        host: '0.0.0.0',
      },
      plugins: [react()],
      envPrefix: ['VITE_'],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      css: {
        // Ensure Tailwind is applied even if PostCSS auto-loading fails
        postcss: {
          plugins: [tailwindcss, autoprefixer],
        },
      },
    };
});
