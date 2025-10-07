import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    server: {
        host: '0.0.0.0',
        proxy: {
            '/api/dashscope': {
                target: 'https://dashscope.aliyuncs.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/dashscope/, ''),
                headers: {
                    'Origin': 'https://dashscope.aliyuncs.com'
                }
            }
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'esbuild'
    }
})
