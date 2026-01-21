import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { base } from 'framer-motion/client'

// https://vite.dev/config/
export default defineConfig({
  base: '/streaming/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
