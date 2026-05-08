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
import { Square, RotateCcw } from 'lucide-react';

const AGUI_BASE_URL = import.meta.env.VITE_AGUI_BASE_URL || 'http://localhost:8000';

/**
 * /planning/detailed — v2 任务式生成主战场。
 */
export default function AGUIPlanRun() {
    const { agent, setForwardedProps } = useMemo(
        () => createContextualHttpAgent({ url: `${AGUI_BASE_URL}/langgraph` }),
        [],
    );

    return (
        <div
            className="agui-run-shell min-h-[100dvh] bg-white text-gray-900"
            data-agui-run
        >
            <CopilotKitProvider
                agents__unsafe_dev_only={{ [AGENT_ID]: agent }}
                showDevConsole={false}
            >
                <RunInner setForwardedProps={setForwardedProps} />
            </CopilotKitProvider>
        </div>
    );
}

function RunInner({ setForwardedProps }) {
    const navigate = useNavigate();
    const { currentPet } = usePets();
    const { completeWithAguiResult } = usePlanGeneration();
    const {
        events,
        error,
        completedDetail,
        isRunning,
        hasStarted,
        start,
        cancel,
        reset,
    } = useAGUIPlanRunner({ setForwardedProps });

    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
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

    // 完成后接回原 SSE 结果流程:PlanGenerationContext → /plan/summary
    useEffect(() => {
        if (!completedDetail) return;
        // 给 BackgroundMode disable 一点时间再跳
        const t = setTimeout(() => {
            void completeWithAguiResult(completedDetail)
                .then(() => {
                    sessionStorage.removeItem('pending_agui_plan_payload');
                    navigate('/plan/summary', { replace: true });
                })
                .catch((e) => {
                    console.error('[AGUIPlanRun] result handoff failed', e);
                });
        }, 400);
        return () => clearTimeout(t);
    }, [completedDetail, completeWithAguiResult, navigate]);

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

    // 从 events 中提取 plan_board items 用于 TaskQueueCompact
    const planItems = useMemo(() => {
        for (let i = events.length - 1; i >= 0; i -= 1) {
            if (events[i]?.detail?.view_type === 'plan_board') {
                return events[i].detail.items || [];
            }
        }
        return [];
    }, [events]);

    return (
        <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-white">
            <PlanRunHeader pet={displayPet} onBack={handleBack} />

            <main className="relative flex min-h-0 flex-1 flex-col px-4 pb-32">
                <div className="min-h-0 flex-1">
                    <TimelineFeed
                        events={events}
                        emptyText={hasStarted ? '等待第一个事件...' : '正在启动...'}
                    />
                </div>
            </main>

            {/* 底部固定区域：TaskQueueCompact + ActionBar */}
            <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px]">
                <TaskQueueCompact items={planItems} />
                <nav className="flex items-center gap-2 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
                    {hasStarted && isRunning && !error && (
                        <Button
                            type="button"
                            onClick={() => setShowCancelConfirm(true)}
                            className="h-9 cursor-pointer rounded-full border border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
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
                            className="h-9 cursor-pointer rounded-full border border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
                            variant="ghost"
                        >
                            <RotateCcw className="mr-1.5 size-3.5" />
                            重试
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
