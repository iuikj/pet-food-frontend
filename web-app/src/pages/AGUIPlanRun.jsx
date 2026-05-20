import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { BackgroundMode } from '@anuradev/capacitor-background-mode';
import { CopilotKitProvider } from '@copilotkit/react-core/v2';
import { createContextualHttpAgent } from '../utils/contextualHttpAgent';
import { useAGUIPlanRunner, AGENT_ID } from '../hooks/useAGUIPlanRunner';
import { usePets } from '../hooks/usePets';
import { usePlanGeneration } from '../hooks/usePlanGeneration';
import { Button } from '../components/ui/button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import PlanRunHeader from '../components/agui-plan/PlanRunHeader';
import TimelineFeed from '../components/agui-plan/TimelineFeed';
import TaskQueueCompact from '../components/agui-plan/TaskQueueCompact';
import { createClientId } from '../utils/id';
import { Square, RotateCcw, TriangleAlert } from 'lucide-react';

const AGUI_BASE_URL = import.meta.env.VITE_AGUI_BASE_URL
    || import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1\/?$/, '')
    || 'http://localhost:8000';

/**
 * /planning/detailed — v2 任务式生成主战场。
 */
export default function AGUIPlanRun() {
    const threadId = useMemo(() => createClientId('thread'), []);

    const { agent, setForwardedProps } = useMemo(
        () => createContextualHttpAgent({ url: `${AGUI_BASE_URL}/langgraph`, threadId }),
        [threadId],
    );

    return (
        <div
            className="agui-run-shell min-h-[100dvh] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            data-agui-run
        >
            <CopilotKitProvider
                agents__unsafe_dev_only={{ [AGENT_ID]: agent }}
                showDevConsole={false}
            >
                <RunInner setForwardedProps={setForwardedProps} threadId={threadId} />
            </CopilotKitProvider>
        </div>
    );
}

function RunInner({ setForwardedProps, threadId }) {
    const navigate = useNavigate();
    const { currentPet } = usePets();
    const { completeWithAguiResult } = usePlanGeneration();
    const {
        events,
        error,
        completedDetail,
        latestPlanItems,
        isRunning,
        hasStarted,
        start,
        cancel,
        reset,
    } = useAGUIPlanRunner({ setForwardedProps });

    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [staleStreamStartedAt, setStaleStreamStartedAt] = useState(null);
    const [pendingPayload] = useState(() => {
        const raw = sessionStorage.getItem('pending_agui_plan_payload');
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            return parsed?.pet_information ? parsed : null;
        } catch (e) {
            console.warn('[AGUIPlanRun] invalid pending payload', e);
            sessionStorage.removeItem('pending_agui_plan_payload');
            return null;
        }
    });

    useEffect(() => {
        if (!pendingPayload) {
            navigate('/plan/create', { replace: true });
        }
    }, [navigate, pendingPayload]);

    useEffect(() => {
        if (!pendingPayload || hasStarted) return;
        start(pendingPayload);
    }, [pendingPayload, hasStarted, start]);

    const isStreamStale = Boolean(
        staleStreamStartedAt &&
        hasStarted &&
        events.length === 0 &&
        !error &&
        !completedDetail,
    );

    useEffect(() => {
        if (!hasStarted || events.length > 0 || error || completedDetail || staleStreamStartedAt) {
            return undefined;
        }

        const timer = setTimeout(() => {
            setStaleStreamStartedAt(Date.now());
        }, 12000);
        return () => clearTimeout(timer);
    }, [completedDetail, error, events.length, hasStarted, staleStreamStartedAt]);

    // Capacitor 后台模式:运行中开,完成 / 错误 / 取消时关
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return undefined;
        let cleanup = false;
        const apply = async () => {
            try {
                if (isRunning) {
                    await BackgroundMode.setSettings({
                        title: '正在生成专属计划',
                        text: 'AI Agent 正在工作,请勿关闭应用',
                        icon: 'ic_launcher',
                        color: 'A3D9A5',
                        resume: true,
                        hidden: false,
                        silent: false,
                    });
                    await BackgroundMode.enable();
                } else if (!cleanup) {
                    await BackgroundMode.disable();
                }
            } catch (e) {
                console.warn('[AGUIPlanRun] BackgroundMode failed', e);
            }
        };
        apply();
        return () => {
            cleanup = true;
            if (Capacitor.isNativePlatform()) {
                BackgroundMode.disable().catch(() => {});
            }
        };
    }, [isRunning]);

    // 完成后注入 PlanGenerationContext（不再自动 navigate）
    useEffect(() => {
        if (!completedDetail) return;
        const t = setTimeout(() => {
            void completeWithAguiResult(completedDetail, {
                completedPlanId: completedDetail.plan_id || threadId,
            }).catch((e) => {
                console.error('[AGUIPlanRun] result handoff failed', e);
            });
        }, 400);
        return () => clearTimeout(t);
    }, [completedDetail, completeWithAguiResult, threadId]);

    const handleBack = () => {
        if (isRunning) {
            setShowCancelConfirm(true);
        } else {
            navigate('/plan/create', { replace: true });
        }
    };

    const confirmCancel = () => {
        setShowCancelConfirm(false);
        cancel();
        sessionStorage.removeItem('pending_agui_plan_payload');
        navigate('/plan/create', { replace: true });
    };

    const retry = () => {
        setStaleStreamStartedAt(null);
        reset();
        start(pendingPayload);
    };

    const displayPet = currentPet || {
        name: pendingPayload?.pet_name,
        type: pendingPayload?.pet_information?.pet_type,
        breed: pendingPayload?.pet_information?.pet_breed,
        age: pendingPayload?.pet_information?.pet_age,
        weight: pendingPayload?.pet_information?.pet_weight,
        health_status: pendingPayload?.pet_information?.health_status,
    };

    return (
        <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-white dark:bg-gray-900">
            <PlanRunHeader pet={displayPet} onBack={handleBack} />

            <main className="relative flex min-h-0 flex-1 flex-col pb-32">
                {(error || isStreamStale) && (
                    <div className="px-4 py-3">
                        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                            <div className="flex items-start gap-3">
                                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">
                                        {error ? '生成启动失败' : '还没有收到生成事件'}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-red-600/80 dark:text-red-200/80">
                                        {error || '已发起生成请求，但长时间没有收到 AG-UI 事件。请检查浏览器 Network 里的 /langgraph 请求状态。'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="min-h-0 flex-1">
                    <TimelineFeed
                        events={events}
                        emptyText={hasStarted ? '等待第一个事件...' : '正在启动...'}
                        completedDetail={completedDetail}
                        threadId={threadId}
                        petName={displayPet?.name}
                    />
                </div>
            </main>

            {/* 底部固定区域：TaskQueueCompact + ActionBar */}
            <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px]">
                <TaskQueueCompact items={latestPlanItems} />
                <nav className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 px-4 py-3 backdrop-blur-sm">
                    {hasStarted && isRunning && !error && (
                        <Button
                            type="button"
                            onClick={() => setShowCancelConfirm(true)}
                            className="h-9 cursor-pointer rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            variant="ghost"
                        >
                            <Square className="mr-1.5 size-3.5" />
                            停止
                        </Button>
                    )}
                    {error && (
                        <Button
                            type="button"
                            onClick={retry}
                            className="h-9 cursor-pointer rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            variant="ghost"
                        >
                            <RotateCcw className="mr-1.5 size-3.5" />
                            重试
                        </Button>
                    )}
                    {hasStarted && !isStreamStale && events.length === 0 && !error && (
                        <Button
                            type="button"
                            onClick={() => setStaleStreamStartedAt(Date.now())}
                            className="h-9 cursor-pointer rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            variant="ghost"
                        >
                            检查连接
                        </Button>
                    )}
                </nav>
            </div>

            <ConfirmDialog
                open={showCancelConfirm}
                onOpenChange={setShowCancelConfirm}
                title="停止生成?"
                description="当前的 AI 工作进度将丢失,确定要停止吗?"
                confirmText="确定停止"
                cancelText="继续"
                onConfirm={confirmCancel}
                destructive
            />
        </div>
    );
}
