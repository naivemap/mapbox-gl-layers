import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MapboxGLLayers',
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['echarts', 'proj4'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          echarts: 'echarts',
          proj4: 'proj4',
        },
      },
    },
  },
})
