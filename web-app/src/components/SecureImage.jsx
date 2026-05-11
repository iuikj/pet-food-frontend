import { useState, useEffect, memo } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * 安全图片组件 — 解决 Capacitor HTTPS WebView 加载 HTTP 图片的 Mixed Content 问题。
 *
 * 原理：Capacitor 原生 HTTP 插件会拦截 fetch() 走 native 层，不受 WebView 同源策略限制。
 * 本组件在 Native 平台上通过 fetch → blob → URL.createObjectURL 获取可显示的 blob URL，
 * 在 Web 平台上直接使用原始 src。
 *
 * PR3：新增模块级 LRU 缓存
 *   - 同一 src 多次挂载/卸载共享单个 blob URL，节省重复 fetch+createObjectURL
 *   - Map 按插入顺序遍历，命中时 delete+set 把 key 移到末尾标记最近使用
 *   - 超过 BLOB_CACHE_MAX 时淘汰最早的 entry 并 revoke 释放内存
 *   - 失败的 Promise 从缓存移除，避免后续命中失败 Promise
 */
const BLOB_CACHE_MAX = 50;
// Map 保证插入顺序，配合 delete+set 实现 LRU
const blobCache = new Map(); // src -> Promise<blobUrl>

function getCachedBlobUrl(src, fetchFn) {
    // 命中：移到末尾标记为最近使用
    if (blobCache.has(src)) {
        const promise = blobCache.get(src);
        blobCache.delete(src);
        blobCache.set(src, promise);
        return promise;
    }
    const promise = fetchFn();
    blobCache.set(src, promise);
    // LRU 淘汰
    if (blobCache.size > BLOB_CACHE_MAX) {
        const oldestKey = blobCache.keys().next().value;
        const oldestPromise = blobCache.get(oldestKey);
        blobCache.delete(oldestKey);
        // 淘汰时 revoke 旧 blob 释放内存
        Promise.resolve(oldestPromise)
            .then((url) => {
                if (typeof url === 'string' && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            })
            .catch(() => { /* swallow */ });
    }
    // fetch 失败时从 cache 移除，避免后续命中失败 Promise
    promise.catch(() => {
        if (blobCache.get(src) === promise) {
            blobCache.delete(src);
        }
    });
    return promise;
}

function SecureImage({ src, alt = '', fallback = null, className = '', ...rest }) {
    const [displaySrc, setDisplaySrc] = useState(() => {
        // data URL 或 blob URL 可直接使用；Web 平台也直接使用
        if (!src) return '';
        if (!Capacitor.isNativePlatform()) return src;
        if (src.startsWith('data:') || src.startsWith('blob:')) return src;
        return ''; // 需要异步加载
    });
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) {
            setDisplaySrc('');
            setError(false);
            return;
        }

        // data URL / blob URL 直接使用
        if (src.startsWith('data:') || src.startsWith('blob:')) {
            setDisplaySrc(src);
            setError(false);
            return;
        }

        // Web 平台直接使用原始 URL
        if (!Capacitor.isNativePlatform()) {
            setDisplaySrc(src);
            setError(false);
            return;
        }

        // Native 平台：通过 fetch (原生 HTTP) 下载后转 blob URL，命中模块级 LRU 缓存
        let cancelled = false;

        getCachedBlobUrl(src, async () => {
            const res = await fetch(src);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        })
            .then((blobUrl) => {
                if (cancelled) return;
                setDisplaySrc(blobUrl);
                setError(false);
            })
            .catch((err) => {
                if (cancelled) return;
                console.warn('[SecureImage] fetch failed:', src, err);
                setError(true);
            });

        // PR3：不再在卸载时 revoke blob URL — 缓存复用，让 LRU 决定何时释放
        return () => {
            cancelled = true;
        };
    }, [src]);

    if (!src || error) {
        return fallback;
    }

    if (!displaySrc) {
        // 正在加载中（仅 Native 异步路径）
        return fallback;
    }

    return (
        <img
            src={displaySrc}
            alt={alt}
            className={className}
            loading="lazy"
            decoding="async"
            {...rest}
        />
    );
}

export default memo(SecureImage);
