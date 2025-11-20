import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build', // Change output directory from 'dist' to 'build' for Docker compatibility
  },
  server: {
    // This is crucial for Vite to work inside a Docker container.
    // It tells Vite to listen on all available network interfaces,
    // not just localhost.
    host: true, 
    port: 5173, // The port Vite will run on inside the container.
    
    // Proxy API requests to backend (development only)
    proxy: {
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // Proxy uploaded files (payment slips, etc.)
      '/uploads': {
        target: 'http://backend:8080',
        changeOrigin: true
      }
    },
    
    // Force Vite to poll files directly (important for Docker)
    watch: {
      usePolling: true
    }
  }
})
