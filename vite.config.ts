import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 公開用: base はリポジトリ名に合わせる（https://<user>.github.io/mathematics/）
export default defineConfig({
  base: '/mathematics/',
  plugins: [react()],
})
