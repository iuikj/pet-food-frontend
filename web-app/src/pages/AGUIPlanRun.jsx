import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { BackgroundMode } from '@anuradev/capacitor-background-mode';
import { CopilotKitProvider } from '@copilotkit/react-core/v2';
import { createContextualHttpAgent } from '../utils/contextualHttpAgent';
import { useAGUIPlanRunner, AGENT_ID } from '../hooks/useAGUIPlanRunner';
import { usePets } from '../hooks/usePets';
import PageHeader from '../components/layout/PageHeader';
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
 * /agui-plan/run — v2 任务式生成主战场。
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
        <div className="flex flex-col min-h-[100dvh] bg-background-light dark:bg-background-dark" style={cpkThemeStyle}>
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

    // 完成后跳结果页:把 completedDetail 写入 sessionStorage 跨路由传值
    useEffect(() => {
        if (!completedDetail) return;
        try {
            sessionStorage.setItem('agui_plan_result', JSON.stringify(completedDetail));
        } catch (e) {
            console.warn('[AGUIPlanRun] sessionStorage write failed', e);
        }
        // 给 BackgroundMode disable 一点时间再跳
        const t = setTimeout(() => navigate('/agui-plan/result', { replace: true }), 400);
        return () => clearTimeout(t);
    }, [completedDetail, navigate]);

    const handleBack = () => {
        if (isRunning) {
            setShowCancelConfirm(true);
        } else {
            navigate('/agui-plan');
        }
    };

    const confirmCancel = () => {
        setShowCancelConfirm(false);
        cancel();
        navigate('/agui-plan');
    };

    return (
        <>
            <PageHeader
                title={isRunning ? '生成中' : (error ? '生成失败' : 'AI 工作台')}
                onBack={handleBack}
                rightAction={
                    isRunning ? (
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                        </span>
                    ) : null
                }
            />

            <main className="flex-1 flex flex-col w-full max-w-2xl mx-auto px-4 pb-32 min-h-0">
                <div className="pt-4 shrink-0 space-y-5">
                    <PetHero pet={currentPet} events={events} isRunning={isRunning} error={error} />

                    {!hasStarted && !error && (
                        <section className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-soft border border-gray-100 dark:border-gray-800 text-center">
                            <span className="material-icons-round text-5xl text-primary mb-2">smart_toy</span>
                            <h3 className="font-bold text-base mb-1">准备就绪</h3>
                            <p className="text-xs text-text-muted-light leading-relaxed">
                                点击下方"启动 AI 生成"按钮,实时观察 LangGraph 多智能体工作过程。
                            </p>
                        </section>
                    )}
                </div>

                {hasStarted && (
                    <div className="flex-1 mt-4 min-h-0">
                        <TimelineFeed events={events} emptyText="等待第一个事件..." />
                    </div>
                )}
            </main>

            <PlanGenActionBar
                isRunning={isRunning}
                hasStarted={hasStarted}
                error={error}
                canStart={!!currentPet}
                onStart={start}
                onCancel={() => setShowCancelConfirm(true)}
                onReset={reset}
                onBack={() => navigate('/agui-plan')}
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
        </>
    );
}
