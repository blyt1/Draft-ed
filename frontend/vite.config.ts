import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/beers': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
      '/user': 'http://localhost:8000',
    },
  },
})
