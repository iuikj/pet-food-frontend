import React, { useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
} from 'recharts';
import { pageTransitions } from '../utils/animations';
import { compareWeightRecordsAsc, compareWeightRecordsDesc } from '../utils/weightRecords';
import { usePets } from '../hooks/usePets';
import { useWeights } from '../hooks/useWeights';
import Skeleton from '../components/ui/Skeleton';
import Modal from '../components/Modal';
import WeightRecordSheet from '../components/WeightRecordSheet';

/** YYYY-MM-DD → "M/D" */
function shortDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** YYYY-MM-DD → "YYYY 年 M 月 D 日" */
function longDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 两日期差（天） */
function daysBetween(laterIso, earlierIso) {
    if (!laterIso || !earlierIso) return 0;
    const later = new Date(laterIso);
    const earlier = new Date(earlierIso);
    return Math.round((later - earlier) / 86400000);
}

const RANGE_OPTIONS = [
    { label: '30 天', value: 30 },
    { label: '90 天', value: 90 },
    { label: '半年', value: 180 },
    { label: '1 年', value: 365 },
];

/** recharts Tooltip 自定义样式（深色/浅色都可读） */
function ChartTooltip({ active, payload }) {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    return (
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-lg px-3 py-2 text-xs border border-gray-100 dark:border-gray-700">
            <p className="font-semibold text-text-main-light dark:text-text-main-dark">
                {longDate(data.recorded_date)}
            </p>
            <p className="text-primary font-bold text-base mt-0.5">
                {data.weight} kg
            </p>
            {data.notes && (
                <p className="text-text-muted-light dark:text-text-muted-dark mt-1 max-w-[160px] break-words">
                    {data.notes}
                </p>
            )}
        </div>
    );
}

export default function WeightTrend() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getPetById, isLoading: petLoading } = usePets();
    const pet = getPetById(id);

    const {
        latest,
        history,
        days,
        setDays,
        loading,
        record,
        remove,
    } = useWeights(id, 90);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);

    // 图表用升序数据
    const chartData = useMemo(() => {
        return [...history]
            .sort(compareWeightRecordsAsc)
            .map((r) => ({
                ...r,
                weight: typeof r.weight === 'number' ? r.weight : Number(r.weight),
                label: shortDate(r.recorded_date),
            }));
    }, [history]);

    // 列表用降序
    const listData = useMemo(() => {
        return [...history].sort(compareWeightRecordsDesc);
    }, [history]);

    // 趋势：首尾差
    const trend = useMemo(() => {
        if (chartData.length < 2) return null;
        const first = chartData[0].weight;
        const last = chartData[chartData.length - 1].weight;
        const diff = last - first;
        const span = daysBetween(chartData[chartData.length - 1].recorded_date, chartData[0].recorded_date);
        return { first, last, diff, span };
    }, [chartData]);

    // Y 轴范围：留 0.5kg padding
    const yDomain = useMemo(() => {
        if (chartData.length === 0) return ['auto', 'auto'];
        const weights = chartData.map((d) => d.weight);
        const min = Math.min(...weights);
        const max = Math.max(...weights);
        const pad = Math.max(0.2, (max - min) * 0.15);
        return [Math.max(0, Number((min - pad).toFixed(1))), Number((max + pad).toFixed(1))];
    }, [chartData]);

    const handleSubmit = useCallback(async (payload) => {
        return await record(payload);
    }, [record]);

    const handleConfirmDelete = useCallback(async () => {
        if (!pendingDelete) return;
        await remove(pendingDelete.id);
        setPendingDelete(null);
    }, [pendingDelete, remove]);

    // 宠物不存在（刷新后尚未加载完 / 无效 ID）
    if (!petLoading && !pet) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center gap-4">
                <span className="material-icons-round text-5xl text-text-muted-light opacity-50">pets</span>
                <p className="text-sm text-text-muted-light">未找到该宠物</p>
                <button
                    onClick={() => navigate('/profile')}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white dark:text-gray-900 font-bold text-sm"
                >
                    返回
                </button>
            </div>
        );
    }

    return (
        <motion.div {...pageTransitions} className="min-h-[100dvh] pb-24 overflow-x-hidden bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-40">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                >
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold flex-1 text-center">体重曲线</h1>
                <div className="w-10" />
            </header>

            <main className="px-6 space-y-6">
                {/* 当前体重概览卡 */}
                <section className="bg-primary/20 dark:bg-primary/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/30 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-medium opacity-70">
                                    {pet?.name || '宠物'} · 当前体重
                                </p>
                                {latest ? (
                                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                                        上次记录：{longDate(latest.recorded_date)}
                                    </p>
                                ) : (
                                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                                        暂无记录，点击右下角「+」开始
                                    </p>
                                )}
                            </div>
                            {trend && (
                                <div className="flex flex-col items-end">
                                    <span
                                        className={`flex items-center gap-1 text-sm font-bold ${
                                            trend.diff > 0.05
                                                ? 'text-red-500'
                                                : trend.diff < -0.05
                                                    ? 'text-green-600'
                                                    : 'text-gray-500'
                                        }`}
                                    >
                                        <span className="material-icons-round text-base">
                                            {trend.diff > 0.05 ? 'trending_up' : trend.diff < -0.05 ? 'trending_down' : 'trending_flat'}
                                        </span>
                                        {trend.diff > 0 ? '+' : ''}
                                        {trend.diff.toFixed(1)} kg
                                    </span>
                                    <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-0.5">
                                        近 {trend.span || days} 天
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-5xl font-bold text-text-main-light dark:text-text-main-dark leading-none">
                                {latest ? Number(latest.weight).toFixed(1) : (pet?.weight ? Number(pet.weight).toFixed(1) : '--')}
                            </span>
                            <span className="text-lg font-medium mb-1.5 text-text-muted-light dark:text-text-muted-dark">kg</span>
                        </div>
                    </div>
                </section>

                {/* 时段切换 */}
                <section className="flex items-center gap-2 bg-white dark:bg-surface-dark p-1 rounded-xl shadow-soft">
                    {RANGE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setDays(opt.value)}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                                days === opt.value
                                    ? 'bg-primary text-white dark:text-gray-900 shadow-sm'
                                    : 'text-text-muted-light dark:text-text-muted-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </section>

                {/* 折线图 */}
                <section className="bg-white dark:bg-surface-dark rounded-2xl shadow-soft p-4 pt-5">
                    <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                        <span>体重趋势</span>
                        <span className="text-xs text-text-muted-light dark:text-text-muted-dark font-normal">
                            {chartData.length} 条记录
                        </span>
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="py-12 text-center text-text-muted-light dark:text-text-muted-dark">
                            <span className="material-icons-round text-4xl mb-2 block opacity-40">show_chart</span>
                            <p className="text-sm">暂无体重记录</p>
                            <p className="text-xs opacity-70 mt-1">点击右下角「+」记录首次体重</p>
                        </div>
                    ) : chartData.length === 1 ? (
                        <div className="py-12 text-center text-text-muted-light dark:text-text-muted-dark">
                            <span className="material-icons-round text-4xl mb-2 block opacity-40">show_chart</span>
                            <p className="text-sm">只有 1 条记录</p>
                            <p className="text-xs opacity-70 mt-1">再记录一次体重即可绘制曲线</p>
                        </div>
                    ) : (
                        <div className="h-56 w-full -ml-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 5, right: 12, bottom: 5, left: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:opacity-30" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        minTickGap={24}
                                    />
                                    <YAxis
                                        domain={yDomain}
                                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={40}
                                        unit=" kg"
                                    />
                                    <Tooltip
                                        content={<ChartTooltip />}
                                        cursor={{ stroke: '#A3D9A5', strokeWidth: 1, strokeDasharray: '3 3' }}
                                    />
                                    {latest && (
                                        <ReferenceLine
                                            y={Number(latest.weight)}
                                            stroke="#A3D9A5"
                                            strokeDasharray="4 4"
                                            strokeOpacity={0.6}
                                        />
                                    )}
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#A3D9A5"
                                        strokeWidth={2.5}
                                        dot={{ fill: '#A3D9A5', r: 3 }}
                                        activeDot={{ r: 5, fill: '#A3D9A5', stroke: '#fff', strokeWidth: 2 }}
                                        isAnimationActive
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </section>

                {/* 记录列表 */}
                <section>
                    <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                        <span>记录历史</span>
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }, (_, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white dark:bg-surface-dark p-4 rounded-2xl">
                                    <Skeleton.Circle size={36} />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-6 w-12" />
                                </div>
                            ))}
                        </div>
                    ) : listData.length === 0 ? (
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 text-center text-text-muted-light dark:text-text-muted-dark">
                            <span className="material-icons-round text-3xl mb-2 block opacity-40">inbox</span>
                            <p className="text-sm">还没有记录</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {listData.map((r, idx) => {
                                const prev = listData[idx + 1];
                                const delta = prev ? Number(r.weight) - Number(prev.weight) : null;
                                return (
                                    <li
                                        key={r.id}
                                        className="flex items-center gap-3 bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-soft"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                            <span className="material-icons-round text-lg">monitor_weight</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{longDate(r.recorded_date)}</p>
                                            {r.notes && (
                                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark truncate">
                                                    {r.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-base">
                                                {Number(r.weight).toFixed(1)}
                                                <span className="text-xs text-text-muted-light dark:text-text-muted-dark ml-0.5">
                                                    kg
                                                </span>
                                            </p>
                                            {delta !== null && Math.abs(delta) >= 0.05 && (
                                                <p
                                                    className={`text-[11px] font-medium ${
                                                        delta > 0 ? 'text-red-500' : 'text-green-600'
                                                    }`}
                                                >
                                                    {delta > 0 ? '+' : ''}
                                                    {delta.toFixed(1)}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setPendingDelete(r)}
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted-light hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                                            aria-label="删除记录"
                                        >
                                            <span className="material-icons-round text-lg">delete_outline</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </main>

            {/* 浮动记录按钮 */}
            <button
                onClick={() => setSheetOpen(true)}
                className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-primary text-white dark:text-gray-900 shadow-glow flex items-center justify-center active:scale-95 transition-transform"
                style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
                aria-label="记录体重"
            >
                <span className="material-icons-round text-2xl">add</span>
            </button>

            {/* 记录抽屉 */}
            <WeightRecordSheet
                isOpen={sheetOpen}
                onClose={() => setSheetOpen(false)}
                onSubmit={handleSubmit}
                petName={pet?.name}
                defaultWeight={latest?.weight ?? pet?.weight ?? 0}
            />

            {/* 删除确认 */}
            <Modal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={handleConfirmDelete}
                title="删除该条记录？"
                message={pendingDelete ? `${longDate(pendingDelete.recorded_date)}：${Number(pendingDelete.weight).toFixed(1)} kg` : ''}
                confirmText="删除"
                cancelText="取消"
                type="danger"
            />
        </motion.div>
    );
}
