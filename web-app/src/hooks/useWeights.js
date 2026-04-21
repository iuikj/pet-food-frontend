import { useCallback, useEffect, useRef, useState } from 'react';
import { weightsApi } from '../api';

/**
 * 宠物体重数据 Hook
 *
 * 封装 /weights/* API，统一暴露 latest / history / record / remove
 * 共享于 HomePage 迷你卡、WeightTrend 详情页、WeightRecordSheet 抽屉。
 *
 * @param {string|undefined} petId - 当前宠物 ID，为空时所有操作惰性挂起
 * @param {number} [initialDays=90] - 默认拉取历史的天数
 */
export function useWeights(petId, initialDays = 90) {
    const [latest, setLatest] = useState(null);
    const [history, setHistory] = useState([]);
    const [days, setDays] = useState(initialDays);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 防止组件卸载后 setState
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => { alive.current = false; };
    }, []);

    const fetchLatest = useCallback(async () => {
        if (!petId) return;
        try {
            const res = await weightsApi.getLatestWeight(petId);
            if (!alive.current) return;
            if (res.code === 0) {
                setLatest(res.data || null);
            }
        } catch (err) {
            if (alive.current) setError(err);
        }
    }, [petId]);

    const fetchHistory = useCallback(async (rangeDays = days) => {
        if (!petId) return;
        setLoading(true);
        try {
            const res = await weightsApi.getWeightHistory(petId, rangeDays);
            if (!alive.current) return;
            if (res.code === 0 && Array.isArray(res.data)) {
                setHistory(res.data);
            } else {
                setHistory([]);
            }
        } catch (err) {
            if (alive.current) {
                setError(err);
                setHistory([]);
            }
        } finally {
            if (alive.current) setLoading(false);
        }
    }, [petId, days]);

    // petId / days 变化时自动拉取
    useEffect(() => {
        if (!petId) return;
        fetchLatest();
        fetchHistory(days);
    }, [petId, days, fetchLatest, fetchHistory]);

    /**
     * 记录一次体重（同日覆盖）
     * @returns {Promise<{success: boolean, data?: object, message?: string}>}
     */
    const record = useCallback(async ({ weight, recorded_date, notes }) => {
        if (!petId) return { success: false, message: '未选中宠物' };
        const value = Number(weight);
        if (!Number.isFinite(value) || value <= 0 || value > 500) {
            return { success: false, message: '体重数值无效' };
        }
        try {
            const res = await weightsApi.recordWeight({
                pet_id: petId,
                weight: value,
                recorded_date: recorded_date || undefined,
                notes: notes || undefined,
            });
            if (res.code === 0) {
                // 刷新缓存
                await Promise.all([fetchLatest(), fetchHistory(days)]);
                return { success: true, data: res.data };
            }
            return { success: false, message: res.message || '记录失败' };
        } catch (err) {
            return { success: false, message: err?.message || '记录失败' };
        }
    }, [petId, days, fetchLatest, fetchHistory]);

    /**
     * 删除一条体重记录
     */
    const remove = useCallback(async (recordId) => {
        if (!recordId) return { success: false, message: '记录 ID 为空' };
        try {
            const res = await weightsApi.deleteWeightRecord(recordId);
            if (res.code === 0) {
                await Promise.all([fetchLatest(), fetchHistory(days)]);
                return { success: true };
            }
            return { success: false, message: res.message || '删除失败' };
        } catch (err) {
            return { success: false, message: err?.message || '删除失败' };
        }
    }, [days, fetchLatest, fetchHistory]);

    return {
        latest,
        history,
        days,
        setDays,
        loading,
        error,
        refresh: () => Promise.all([fetchLatest(), fetchHistory(days)]),
        record,
        remove,
    };
}

export default useWeights;
