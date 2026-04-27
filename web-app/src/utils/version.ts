/**
 * 应用版本号 - 从 package.json 注入（编译时由 Vite define 替换）
 *
 * 来源：根目录 package.json 的 version 字段
 * 注入方式：vite.config.js 中的 define: { __APP_VERSION__ }
 *
 * 不要手动维护，发布时由 CI 根据 git tag 自动同步。
 */

declare const __APP_VERSION__: string

export const APP_VERSION: string = __APP_VERSION__

/**
 * 获取后端版本（运行时调用 /health 端点）
 */
export async function fetchBackendVersion(apiBaseUrl: string): Promise<string | null> {
  try {
    const baseHost = apiBaseUrl.replace(/\/api\/v1\/?$/, '')
    const res = await fetch(`${baseHost}/health`, { method: 'GET' })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data?.version ?? null
  } catch {
    return null
  }
}
