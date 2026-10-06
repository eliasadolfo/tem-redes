import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// En producción se sirve desde GitHub Pages bajo /tem-redes/.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/tem-redes/' : '/',
}))
