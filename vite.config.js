import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    // GitHub Pages 部署配置
    // 如果部署在子路径（如 https://username.github.io/blog/），设置 base: '/blog/'
    // 如果部署在自定义域名根路径，设置 base: '/'
    base: isProduction ? (process.env.VITE_BASE_PATH || '/') : '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    }
  }
})