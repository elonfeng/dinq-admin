import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow external access
    port: 3000,
    proxy: {
      // /tool/* → dinq_tools (8081)
      '/tool': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // /auth/* → dinq_gateway (8080)
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // /admin/* → dinq_gateway (8080)
      '/admin': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // /api/* → dinq_gateway (8080)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Production build optimizations
    rollupOptions: {
      output: {
        manualChunks: {
          'ant-design-vue': ['ant-design-vue'],
          'echarts': ['echarts', 'vue-echarts'],
        },
      },
    },
  },
})
