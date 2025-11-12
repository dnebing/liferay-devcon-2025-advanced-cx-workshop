import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: '/o/devcon-elements',
    build: {
      outDir: './vite-build',
      emptyOutDir: true,
    rollupOptions: {
      input: 'src/index.ts',
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/chunk-[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (name && name.endsWith('.css')) return 'assets/style.css';
          return 'assets/[name][extname]';
        },
      },
      external: [],
    },
    target: 'es2020',
    modulePreload: false
  }
});

