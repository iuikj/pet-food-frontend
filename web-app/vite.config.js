import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import path from 'path'
import fs from 'node:fs'
import pkg from './package.json' with { type: 'json' }

/**
 * 拦截 CopilotKit v2 内部 `import './index.css'` 调用：
 * v2 CSS 已预编译（含 Tailwind v4 @layer properties 指令），不能再被项目 Tailwind 3.4 处理。
 * 该插件把目标 CSS 转为 JS 模块，运行时通过 <style> 注入到 head，完全绕过 PostCSS pipeline。
 *
 * 用 \0 前缀的 virtual module 且 ID 不以 .css 结尾，避免 vite 内部 CSS 识别。
 */
const COPILOTKIT_V2_VIRTUAL_ID = '\0virtual:copilotkit-v2-css-shim'
const copilotkitV2CssShim = {
  name: 'copilotkit-v2-css-shim',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!source.endsWith('./index.css') || !importer) return null
    // 兼容 Windows 反斜杠路径
    const normalized = importer.replace(/\\/g, '/')
    if (normalized.includes('@copilotkit/react-core') && normalized.includes('/v2/')) {
      return COPILOTKIT_V2_VIRTUAL_ID
    }
    return null
  },
  load(id) {
    if (id === COPILOTKIT_V2_VIRTUAL_ID) {
      const cssPath = path.resolve(__dirname, 'node_modules/@copilotkit/react-core/dist/v2/index.css')
      const css = fs.readFileSync(cssPath, 'utf-8')
      return `
        const css = ${JSON.stringify(css)};
        if (typeof document !== 'undefined' && !document.querySelector('style[data-copilotkit-v2]')) {
          const style = document.createElement('style');
          style.dataset.copilotkitV2 = 'true';
          style.textContent = css;
          document.head.appendChild(style);
        }
        export default css;
      `
    }
    return null
  },
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [copilotkitV2CssShim, react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // dev 模式下 vite 用 esbuild 预 bundle node_modules，自身 vite plugin 不生效。
  // 加 esbuild plugin 在预 bundle 阶段同样拦截 CopilotKit v2 内部的 CSS import，
  // 转成 JS 注入逻辑，避开 v2 CSS 与项目 Tailwind 3.4 PostCSS 冲突。
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'copilotkit-v2-css-shim-esbuild',
          setup(build) {
            build.onResolve({ filter: /^\.\/index\.css$/ }, (args) => {
              const importer = (args.importer || '').replace(/\\/g, '/')
              if (importer.includes('@copilotkit/react-core') && importer.includes('/v2/')) {
                return { path: args.path, namespace: 'copilotkit-v2-css-shim', pluginData: { importer } }
              }
              return null
            })
            build.onLoad({ filter: /.*/, namespace: 'copilotkit-v2-css-shim' }, (args) => {
              const cssPath = path.resolve(path.dirname(args.pluginData.importer), args.path)
              const css = fs.readFileSync(cssPath, 'utf-8')
              return {
                contents: `
                  const css = ${JSON.stringify(css)};
                  if (typeof document !== 'undefined' && !document.querySelector('style[data-copilotkit-v2]')) {
                    const style = document.createElement('style');
                    style.dataset.copilotkitV2 = 'true';
                    style.textContent = css;
                    document.head.appendChild(style);
                  }
                  export default css;
                `,
                loader: 'js',
              }
            })
          },
        },
      ],
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  server: {
    cors: true,
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
