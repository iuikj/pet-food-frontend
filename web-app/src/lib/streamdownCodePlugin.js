/**
 * Fine-grained Shiki CodeHighlighterPlugin for Streamdown.
 *
 * 替代 `@streamdown/code` 的默认 `code` 导出：
 * `@streamdown/code` 内部 `import { bundledLanguages, bundledLanguagesInfo, createHighlighter } from 'shiki'`,
 * 这会把 shiki 完整 `langs-bundle-full` 索引（含每个语言的 dynamic import 引用）拉进打包链路，
 * 即便 lazy chunk 形式也会让构建产物产生 100+ 个语言 chunk（emacs-lisp/cpp/wasm 等均 600+ KB）。
 *
 * 本实现：
 *   - 只 import `shiki/core` 的 `createHighlighterCore`（不引入任何 langs-bundle-full）
 *   - 用 `shiki/engine/javascript` 的 `createJavaScriptRegexEngine`（与 `@streamdown/code` 默认一致，
 *     避免引入 oniguruma wasm 文件）
 *   - 显式动态 import 需要的 langs / themes，仅覆盖项目实际可能产生的代码块
 *
 * 项目实际语言来源：
 *   - tool.jsx 用 `<CodeBlock language="json" />` 渲染 Tool input/output
 *   - AGUI 上下文中 LLM 可能产生：javascript / typescript / jsx / tsx / python / bash / shell /
 *     json / yaml / markdown / sql / html / css
 *
 * 接口签名兼容 streamdown 的 `CodeHighlighterPlugin`（见 streamdown/dist/index.d.ts）：
 *   - `name: "shiki"`、`type: "code-highlighter"`
 *   - `getThemes()` / `getSupportedLanguages()` / `supportsLanguage(lang)`
 *   - `highlight({ code, language, themes }, callback)`：sync 返回 cached 结果或 null，async 时调用 callback
 */
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

// 安全集：覆盖项目实际可能出现的代码块语言；如果未来扩展，请显式追加 import
const SUPPORTED_LANGS = Object.freeze([
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'python',
  'json',
  'yaml',
  'bash',
  'shell',
  'markdown',
  'sql',
  'html',
  'css',
]);

// 别名表：streamdown 用户可能写 ```js / ```ts / ```py / ```sh / ```md / ```yml
const LANG_ALIASES = Object.freeze({
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shellscript: 'bash',
  md: 'markdown',
  yml: 'yaml',
  text: 'markdown',
  plaintext: 'markdown',
});

const SUPPORTED_LANG_SET = new Set(SUPPORTED_LANGS);
const DEFAULT_THEMES = Object.freeze(['github-light', 'github-dark']);

// JS regex engine 选 forgiving 模式（与 @streamdown/code 默认一致），
// 部分 grammar 含 Oniguruma 特性时也能 fallback 而不抛错
const engine = createJavaScriptRegexEngine({ forgiving: true });

// (theme 名 pair) -> Promise<HighlighterCore>
// 主题相同时共享一个 highlighter；语言按需 loadLanguage
const highlighterByThemeKey = new Map();
// (code, lang, theme pair) -> tokenized result
const tokensCache = new Map();
// (code, lang, theme pair) -> Set<callback>
const subscribers = new Map();
// 已加载的 lang Promise，避免对同一个 lang 触发多次 import
const loadedLangs = new Map();

const themeName = (t) => (typeof t === 'string' ? t : (t?.name ?? 'custom'));
const themeKey = (themes) => `${themeName(themes[0])}::${themeName(themes[1])}`;
const cacheKey = (code, lang, themes) => {
  const start = code.slice(0, 100);
  const end = code.length > 100 ? code.slice(-100) : '';
  return `${lang}:${themeName(themes[0])}:${themeName(themes[1])}:${code.length}:${start}:${end}`;
};

const normalizeLang = (raw) => {
  if (!raw) return 'markdown';
  const lower = String(raw).trim().toLowerCase();
  const aliased = LANG_ALIASES[lower] ?? lower;
  return SUPPORTED_LANG_SET.has(aliased) ? aliased : 'markdown';
};

// 显式语言模块映射 —— 这是 fine-grained 的关键，确保 Vite/Rollup 只生成 13 个 lang chunk
const LANG_LOADERS = {
  javascript: () => import('shiki/langs/javascript.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
  bash: () => import('shiki/langs/bash.mjs'),
  shell: () => import('shiki/langs/shell.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  css: () => import('shiki/langs/css.mjs'),
};

const THEME_LOADERS = {
  'github-light': () => import('shiki/themes/github-light.mjs'),
  'github-dark': () => import('shiki/themes/github-dark.mjs'),
};

const getHighlighter = (themes) => {
  const key = themeKey(themes);
  let promise = highlighterByThemeKey.get(key);
  if (!promise) {
    const themeImports = themes.map((t) => {
      if (typeof t !== 'string') return Promise.resolve({ default: t });
      const loader = THEME_LOADERS[t];
      if (!loader) {
        throw new Error(`[streamdownCodePlugin] Unsupported theme: ${t}. Supported: ${Object.keys(THEME_LOADERS).join(', ')}`);
      }
      return loader();
    });
    promise = createHighlighterCore({
      themes: themeImports,
      langs: [],
      engine,
    });
    highlighterByThemeKey.set(key, promise);
  }
  return promise;
};

const ensureLangLoaded = async (highlighter, lang) => {
  if (highlighter.getLoadedLanguages().includes(lang)) return;
  let loaderPromise = loadedLangs.get(lang);
  if (!loaderPromise) {
    const loader = LANG_LOADERS[lang];
    if (!loader) return; // 兜底：normalizeLang 已保证传入的 lang 属于 SUPPORTED_LANG_SET
    loaderPromise = loader().then((mod) => mod.default);
    loadedLangs.set(lang, loaderPromise);
  }
  const langData = await loaderPromise;
  await highlighter.loadLanguage(langData);
};

export const code = {
  name: 'shiki',
  type: 'code-highlighter',
  getThemes() {
    return DEFAULT_THEMES;
  },
  getSupportedLanguages() {
    return [...SUPPORTED_LANGS];
  },
  supportsLanguage(language) {
    return SUPPORTED_LANG_SET.has(normalizeLang(language));
  },
  highlight({ code: src, language, themes }, callback) {
    const lang = normalizeLang(language);
    const usedThemes = themes && themes.length === 2 ? themes : DEFAULT_THEMES;
    const ckey = cacheKey(src, lang, usedThemes);

    const cached = tokensCache.get(ckey);
    if (cached) return cached;

    if (callback) {
      let subs = subscribers.get(ckey);
      if (!subs) {
        subs = new Set();
        subscribers.set(ckey, subs);
      }
      subs.add(callback);
    }

    getHighlighter(usedThemes)
      .then(async (highlighter) => {
        await ensureLangLoaded(highlighter, lang);
        const loaded = highlighter.getLoadedLanguages().includes(lang) ? lang : 'markdown';
        const result = highlighter.codeToTokens(src, {
          lang: loaded,
          themes: {
            light: usedThemes[0],
            dark: usedThemes[1],
          },
        });
        tokensCache.set(ckey, result);
        const subs = subscribers.get(ckey);
        if (subs) {
          for (const sub of subs) sub(result);
          subscribers.delete(ckey);
        }
      })
      .catch((err) => {
        console.error('[streamdownCodePlugin] highlight failed:', err);
        subscribers.delete(ckey);
      });

    return null;
  },
};

/**
 * 暴露内部 getHighlighter，供 code-block.jsx 等地方共用同一份 highlighter 缓存。
 * 调用方负责传入正确的 themes pair。
 */
export const getHighlighterCore = getHighlighter;

/**
 * 暴露 ensureLangLoaded，供 code-block.jsx 在 highlight 前确保 lang 加载。
 */
export const ensureLanguageLoaded = ensureLangLoaded;

/**
 * 暴露 normalizeLang 与支持语言集，供调用方做 fallback 判断。
 */
export { normalizeLang as normalizeLanguage, SUPPORTED_LANGS as supportedLanguages };
