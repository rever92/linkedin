import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        format: 'es',
        assetFileNames: (assetInfo) => {
          const info = assetInfo?.name ?? '';
          const extType = info.split('.').pop() ?? '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/img/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    }
  },
  base: '/',
  server: {
    headers: {
      // Esto sólo aplica en modo desarrollo local, probablemente no afecte en Plesk:
      'Content-Type': 'application/javascript',
    }
  }
})
