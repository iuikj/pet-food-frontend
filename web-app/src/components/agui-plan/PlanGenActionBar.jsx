import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ClipboardList, RotateCcw, Square } from 'lucide-react';
import { Button } from '../ui/button';
import WidgetSwitch from './EventStream/WidgetSwitch';

/**
 * 任务面板底部操作栏。
 */
export default function PlanGenActionBar({
    events = [],
    isRunning,
    hasStarted,
    error,
    onCancel,
    onReset,
    onBack,
}) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const latestPlanBoard = useMemo(() => {
        for (let index = events.length - 1; index >= 0; index -= 1) {
            if (events[index]?.detail?.view_type === 'plan_board') {
                return events[index];
            }
        }
        return null;
    }, [events]);
    const itemCount = latestPlanBoard?.detail?.items?.length || 0;

    return (
        <nav className="agui-action-dock">
            <div className={drawerOpen ? 'agui-dock-card agui-dock-card--open' : 'agui-dock-card'}>
                {drawerOpen && latestPlanBoard && (
                    <div className="agui-plan-drawer">
                        <WidgetSwitch event={latestPlanBoard} />
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => latestPlanBoard && setDrawerOpen((value) => !value)}
                        disabled={!latestPlanBoard}
                        className="agui-plan-drawer-trigger"
                        aria-expanded={drawerOpen}
                    >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--agui-green-soft)] text-[var(--agui-green-ink)]">
                            <ClipboardList className="size-4" />
                        </span>
                        <div className="min-w-0 text-left">
                            <p className="truncate text-[13px] font-semibold text-[var(--agui-ink)]">
                                {latestPlanBoard ? '任务队列' : (hasStarted ? '等待任务队列' : '启动中')}
                            </p>
                            <p className="truncate text-[11px] text-[var(--agui-muted)]">
                                {latestPlanBoard ? `${itemCount} 项计划任务` : '详细工作流正在准备'}
                            </p>
                        </div>
                        <ChevronDown className={`size-4 shrink-0 text-[var(--agui-muted)] transition-transform duration-200 ${drawerOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {hasStarted && isRunning && !error && (
                        <Button
                            type="button"
                            onClick={onCancel}
                            className="h-10 shrink-0 cursor-pointer rounded-full border border-[var(--agui-hairline)] bg-white/[0.48] px-3 text-[12px] font-semibold text-[var(--agui-muted)] hover:bg-white/[0.74] active:scale-[0.98]"
                            variant="ghost"
                        >
                            <Square data-icon="inline-start" />
                            停止
                        </Button>
                    )}

                    {error && (
                        <>
                        <Button
                            type="button"
                            onClick={onBack}
                            className="h-10 shrink-0 cursor-pointer rounded-full bg-white/[0.72] px-3 text-[12px] font-semibold text-[var(--agui-ink)] hover:bg-white"
                            variant="ghost"
                        >
                            <ArrowLeft data-icon="inline-start" />
                            返回
                        </Button>
                        <Button
                            type="button"
                            onClick={onReset}
                            className="h-10 shrink-0 cursor-pointer rounded-full bg-[var(--agui-ink)] px-3 text-[12px] font-semibold text-white hover:bg-[var(--agui-ink-soft)]"
                        >
                            <RotateCcw data-icon="inline-start" />
                            重试
                        </Button>
                        </>
                    )}

                    {hasStarted && !isRunning && !error && (
                        <p className="shrink-0 px-2 text-center text-xs text-[var(--agui-muted)]">
                            正在前往结果页...
                        </p>
                    )}
                </div>
            </div>
        </nav>
    );
}
