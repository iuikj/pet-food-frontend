import { useState, useEffect, memo } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * 安全图片组件 — 解决 Capacitor HTTPS WebView 加载 HTTP 图片的 Mixed Content 问题。
 *
 * 原理：Capacitor 原生 HTTP 插件会拦截 fetch() 走 native 层，不受 WebView 同源策略限制。
 * 本组件在 Native 平台上通过 fetch → blob → URL.createObjectURL 获取可显示的 blob URL，
 * 在 Web 平台上直接使用原始 src。
 */
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

        // Native 平台：通过 fetch (原生 HTTP) 下载后转 blob URL
        let revoked = false;
        let blobUrl = '';

        fetch(src)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.blob();
            })
            .then((blob) => {
                if (revoked) return;
                blobUrl = URL.createObjectURL(blob);
                setDisplaySrc(blobUrl);
                setError(false);
            })
            .catch((err) => {
                if (revoked) return;
                console.warn('[SecureImage] fetch failed:', src, err);
                setError(true);
            });

        return () => {
            revoked = true;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [src]);

    if (!src || error) {
        return fallback;
    }

    if (!displaySrc) {
        // 正在加载中（仅 Native 异步路径）
        return fallback;
    }

    return <img src={displaySrc} alt={alt} className={className} {...rest} />;
}

export default memo(SecureImage);
