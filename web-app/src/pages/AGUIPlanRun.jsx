import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { BackgroundMode } from '@anuradev/capacitor-background-mode';
import { CopilotKitProvider } from '@copilotkit/react-core/v2';
import { Activity, ChevronLeft, Sparkles } from 'lucide-react';
import { createContextualHttpAgent } from '../utils/contextualHttpAgent';
import { useAGUIPlanRunner, AGENT_ID } from '../hooks/useAGUIPlanRunner';
import { usePets } from '../hooks/usePets';
import { usePlanGeneration } from '../hooks/usePlanGeneration';
import { Button } from '../components/ui/button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import PetHero from '../components/agui-plan/PetHero';
import TimelineFeed from '../components/agui-plan/TimelineFeed';
import PlanGenActionBar from '../components/agui-plan/PlanGenActionBar';

const AGUI_BASE_URL = import.meta.env.VITE_AGUI_BASE_URL || 'http://localhost:8000';

// scope 化注入 cpk 主题变量(与 AGUITest 保持一致,不污染全局)
const cpkThemeStyle = {
    '--cpk-font-sans': "'Plus Jakarta Sans', system-ui, sans-serif",
    '--cpk-radius-md': '0.875rem',
    '--cpk-radius-lg': '1.125rem',
    '--cpk-radius-xl': '1.5rem',
};

/**
 * /planning/detailed — v2 任务式生成主战场。
 *
 * 顶层只创建 ContextualHttpAgent 实例 + 包 Provider,真正逻辑在 RunInner 里。
 * 这样保证 useAgent / agent.subscribe 等 Provider 内 hook 能正常工作。
 */
export default function AGUIPlanRun() {
    // agent 工厂只构造一次:threadId / messages 等绑在实例上,重建会丢历史
    const { agent, setForwardedProps } = useMemo(
        () => createContextualHttpAgent({ url: `${AGUI_BASE_URL}/langgraph` }),
        [],
    );

    return (
        <div
            className="agui-run-shell min-h-[100dvh] bg-[var(--agui-stage)] text-[var(--agui-ink)]"
            data-agui-run
            style={cpkThemeStyle}
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

function RunHeader({ isRunning, error, onBack }) {
    const stateLabel = error ? '失败' : (isRunning ? '执行中' : '准备中');

    return (
        <header className="agui-run-header sticky top-0 z-40 shrink-0 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
            <div className="flex h-12 items-center justify-between gap-3 rounded-[24px] border border-white/70 bg-white/[0.72] px-2.5 shadow-[0_14px_40px_rgba(37,35,28,0.08)] backdrop-blur-2xl">
                <Button
                    aria-label="返回"
                    className="size-9 cursor-pointer rounded-full border border-black/[0.04] bg-white/[0.78] text-[var(--agui-ink)] shadow-[0_4px_18px_rgba(37,35,28,0.08)] hover:bg-white"
                    onClick={onBack}
                    size="icon"
                    type="button"
                    variant="ghost"
                >
                    <ChevronLeft />
                </Button>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <h1 className="truncate text-[19px] font-semibold leading-none tracking-normal">
                            {error ? '生成失败' : '专属计划生成中'}
                        </h1>
                        {!error && (
                            <Sparkles className="size-3.5 text-[var(--agui-green)]" />
                        )}
                    </div>
                    <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--agui-muted)]">
                        正在整理宠物档案与饮食方案
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/[0.58] px-2.5 py-1.5">
                    <span
                        aria-label={stateLabel}
                        className={isRunning && !error ? 'agui-live-dot' : 'agui-live-dot agui-live-dot--idle'}
                    />
                    <Activity className="size-3.5 text-[var(--agui-muted)]" />
                </div>
            </div>
        </header>
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

    return (
        <div className="agui-phone-surface relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[var(--agui-app-bg)] shadow-[0_0_0_1px_rgba(255,255,255,0.55),0_32px_90px_rgba(34,31,25,0.16)]">
            <RunHeader isRunning={isRunning} error={error} onBack={handleBack} />

            <main className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-[9.5rem]">
                <div className="shrink-0 pt-2">
                    <PetHero pet={displayPet} events={events} isRunning={isRunning || !hasStarted} error={error} />
                </div>

                <div className="mt-5 min-h-0 flex-1">
                    <TimelineFeed
                        events={events}
                        emptyText={hasStarted ? '等待第一个事件...' : '正在启动详细工作流...'}
                    />
                </div>
            </main>

            <PlanGenActionBar
                events={events}
                isRunning={isRunning}
                hasStarted={hasStarted}
                error={error}
                onCancel={() => setShowCancelConfirm(true)}
                onReset={retry}
                onBack={() => navigate('/plan/create', { replace: true })}
            />

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
