import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  oxc: mode === 'production' ? {
    transform: { drop: ['console', 'debugger'] }
  } : {},
}))
