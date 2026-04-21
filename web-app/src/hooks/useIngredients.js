import { useCallback, useEffect, useRef, useState } from 'react';
import { ingredientsApi } from '../api';

/**
 * 食材库 Hook
 *
 * 统一封装 /ingredients/* 接口，暴露列表 / 分类 / CRUD，
 * 支持搜索、分类筛选、归属切换（all / system / custom）与分页。
 *
 * @param {object} options
 * @param {string}  [options.initialScope='all']  初始归属范围
 * @param {number}  [options.pageSize=50]         分页大小
 */
export function useIngredients(options = {}) {
    const { initialScope = 'all', pageSize = 50 } = options;

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);

    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [scope, setScope] = useState(initialScope);

    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    // 并发安全：避免过期请求回填
    const reqIdRef = useRef(0);

    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => { alive.current = false; };
    }, []);

    /** 重新加载首页（重置分页） */
    const reload = useCallback(async () => {
        const myId = ++reqIdRef.current;
        setLoading(true);
        setError(null);
        try {
            const res = await ingredientsApi.getIngredients({
                keyword, category, sub_category: subCategory, scope,
                limit: pageSize, offset: 0,
            });
            if (myId !== reqIdRef.current || !alive.current) return;
            if (res.code === 0 && res.data) {
                setItems(res.data.items || []);
                setTotal(res.data.total || 0);
                setOffset((res.data.items || []).length);
            } else {
                setItems([]);
                setTotal(0);
                setOffset(0);
                setError(new Error(res.message || '获取食材失败'));
            }
        } catch (err) {
            if (alive.current) setError(err);
        } finally {
            if (alive.current && myId === reqIdRef.current) setLoading(false);
        }
    }, [keyword, category, subCategory, scope, pageSize]);

    /** 加载下一页 */
    const loadMore = useCallback(async () => {
        if (loading || loadingMore) return;
        if (items.length >= total) return;
        setLoadingMore(true);
        try {
            const res = await ingredientsApi.getIngredients({
                keyword, category, sub_category: subCategory, scope,
                limit: pageSize, offset,
            });
            if (!alive.current) return;
            if (res.code === 0 && res.data) {
                setItems((prev) => [...prev, ...(res.data.items || [])]);
                setOffset((prev) => prev + (res.data.items?.length || 0));
            }
        } finally {
            if (alive.current) setLoadingMore(false);
        }
    }, [loading, loadingMore, items.length, total, keyword, category, subCategory, scope, pageSize, offset]);

    /** 拉分类聚合 */
    const fetchCategories = useCallback(async () => {
        try {
            const res = await ingredientsApi.getIngredientCategories();
            if (!alive.current) return;
            if (res.code === 0 && Array.isArray(res.data)) {
                setCategories(res.data);
            }
        } catch {
            // 静默失败：分类失败不阻塞主列表
        }
    }, []);

    /** 过滤条件变化时重载 */
    useEffect(() => {
        reload();
    }, [reload]);

    /** 首次加载分类 */
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    /** 创建自定义食材 */
    const create = useCallback(async (payload) => {
        try {
            const res = await ingredientsApi.createIngredient(payload);
            if (res.code === 0 && res.data) {
                await Promise.all([reload(), fetchCategories()]);
                return { success: true, data: res.data };
            }
            return { success: false, message: res.message || '创建失败' };
        } catch (err) {
            return { success: false, message: err?.response?.data?.message || err?.message || '创建失败' };
        }
    }, [reload, fetchCategories]);

    /** 更新自定义食材 */
    const update = useCallback(async (ingredientId, payload) => {
        try {
            const res = await ingredientsApi.updateIngredient(ingredientId, payload);
            if (res.code === 0 && res.data) {
                // 局部更新当前列表
                setItems((prev) => prev.map((it) => (it.id === ingredientId ? res.data : it)));
                return { success: true, data: res.data };
            }
            return { success: false, message: res.message || '更新失败' };
        } catch (err) {
            return { success: false, message: err?.response?.data?.message || err?.message || '更新失败' };
        }
    }, []);

    /** 删除自定义食材 */
    const remove = useCallback(async (ingredientId) => {
        try {
            const res = await ingredientsApi.deleteIngredient(ingredientId);
            if (res.code === 0) {
                setItems((prev) => prev.filter((it) => it.id !== ingredientId));
                setTotal((prev) => Math.max(0, prev - 1));
                return { success: true };
            }
            return { success: false, message: res.message || '删除失败' };
        } catch (err) {
            return { success: false, message: err?.response?.data?.message || err?.message || '删除失败' };
        }
    }, []);

    return {
        // 数据
        items,
        total,
        categories,
        // 状态
        loading,
        loadingMore,
        error,
        hasMore: items.length < total,
        // 过滤条件（受控）
        keyword, setKeyword,
        category, setCategory,
        subCategory, setSubCategory,
        scope, setScope,
        // 操作
        reload,
        loadMore,
        refreshCategories: fetchCategories,
        create,
        update,
        remove,
    };
}

export default useIngredients;
