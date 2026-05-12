import { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * useFanoutDetail
 *
 * 持有 fanout 详情页打开状态（detailCard 描述符），并在 detail 打开时拦截：
 * - Capacitor Android 物理 backButton（仅 detail 打开期间订阅，保证主流 useBackButton 不被干扰）
 * - 浏览器/WebView popstate（对应 React Router navigate(-1) 与 iOS 侧滑回退）
 *
 * detailCard 形态由调用方决定，至少应包含 { kind, id }，
 * TimelineFeed 据此从对应 buckets 取实时事件喂给 FanoutDetailView。
 *
 * `options.enabled`（默认 true）：嵌套 TimelineFeed（详情页内）传 false 关闭监听 / openDetail，
 * 避免 popstate / backButton 被多个实例重复订阅；规则约束下 hook 必须无条件调用，
 * 因此通过参数门控副作用，而非条件调用 hook。
 */
export function useFanoutDetail(options = {}) {
    const { enabled = true } = options;
    const [detailCard, setDetailCard] = useState(null);
    const detailRef = useRef(null);
    const pushedRef = useRef(false);

    // 同步 detailCard 到 ref，供 effect / 事件回调消费（不在 render 中读 ref.current）。
    useEffect(() => {
        detailRef.current = detailCard;
    }, [detailCard]);

    const openDetail = useCallback((card) => {
        if (!enabled) return;
        if (!card) return;
        setDetailCard(card);
        if (typeof window !== 'undefined' && window.history) {
            try {
                window.history.pushState({ fanoutDetailOpen: true }, '');
                pushedRef.current = true;
            } catch {
                pushedRef.current = false;
            }
        }
    }, [enabled]);

    const closeDetail = useCallback(() => {
        if (!detailRef.current) return;
        setDetailCard(null);
        // 消费此前 pushState 的合成 entry，避免遗留历史污染。
        if (pushedRef.current && typeof window !== 'undefined' && window.history) {
            pushedRef.current = false;
            try {
                window.history.back();
            } catch {
                // 忽略历史栈异常
            }
        }
    }, []);

    // 浏览器/WebView popstate（含 navigate(-1) 触发的合成回退）。
    useEffect(() => {
        if (!enabled) return undefined;
        if (typeof window === 'undefined') return undefined;
        const onPop = () => {
            if (detailRef.current) {
                pushedRef.current = false;
                setDetailCard(null);
            }
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [enabled]);

    // Capacitor Android backButton：仅 detail 打开时订阅，关闭即解绑。
    useEffect(() => {
        if (!enabled) return undefined;
        if (!Capacitor.isNativePlatform()) return undefined;
        if (!detailCard) return undefined;
        const handlePromise = CapacitorApp.addListener('backButton', () => {
            setDetailCard(null);
        });
        return () => {
            Promise.resolve(handlePromise).then((h) => h?.remove?.()).catch(() => {});
        };
    }, [enabled, detailCard]);

    return { detailCard, openDetail, closeDetail };
}
