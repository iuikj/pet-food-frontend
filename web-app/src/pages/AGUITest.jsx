import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    CopilotKitProvider,
    CopilotChat,
    useConfigureSuggestions,
    useAgent,
} from '@copilotkit/react-core/v2';
import { createContextualHttpAgent } from '../utils/contextualHttpAgent';
import { usePets } from '../hooks/usePets';
import { useUser } from '../hooks/useUser';
import SecureImage from '../components/SecureImage';
// v2 入口内部 import './index.css'，由 vite-plugin-copilotkit-v2-css 拦截转为运行时 <style> 注入
// 见 vite.config.js（避开项目 Tailwind 3.4 与 v2 CSS 中 @layer properties 等 v4 指令的冲突）

const AGUI_BASE_URL = import.meta.env.VITE_AGUI_BASE_URL || 'http://localhost:8000';
const AGUI_AGENT_NAME = import.meta.env.VITE_AGUI_AGENT_NAME || 'v2agent';

const PET_TYPE_LABEL = { cat: '猫咪', dog: '狗狗' };

// scope 化注入 cpk 主题变量：只在本页 root 生效，不污染全局
// v2 内部样式用 --cpk-* 命名空间，覆盖这些就能让 chat 视觉与项目（Plus Jakarta Sans + sage green + 1rem radius）一致
const cpkThemeStyle = {
    '--cpk-font-sans': "'Plus Jakarta Sans', system-ui, sans-serif",
    '--cpk-radius-md': '0.875rem',
    '--cpk-radius-lg': '1.125rem',
    '--cpk-radius-xl': '1.5rem',
};

/** 把前端 PetResponse 映射为后端 PetInformation 的字段（与 plan_service 一致） */
function petToInformation(pet) {
    if (!pet) return null;
    const info = {
        pet_type: pet.type,            // PetResponse.type → PetInformation.pet_type ('cat'|'dog')
        pet_breed: pet.breed,           // breed → pet_breed
        pet_age: pet.age,               // age (月) → pet_age
        pet_weight: pet.weight,         // weight (kg) → pet_weight
        health_status: pet.health_status,
    };
    // 移除 undefined/null，避免后端 Pydantic 校验时把 null 当成显式空值
    return Object.fromEntries(
        Object.entries(info).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
}

function buildSuggestions(pet) {
    if (!pet) {
        return [
            { title: '一周营养餐', message: '帮我设计一份猫咪一周的营养餐' },
            { title: '常见过敏', message: '宠物常见的食物过敏原有哪些？' },
            { title: '健康零食', message: '健康的宠物零食推荐有哪些？' },
        ];
    }
    const typeLabel = PET_TYPE_LABEL[pet.type] || '宠物';
    const breed = pet.breed || typeLabel;
    const ageDesc = pet.age ? `${pet.age} 月龄` : '年龄未知';
    const weightDesc = pet.weight ? `${pet.weight} kg` : '体重未知';
    // title 短词（pill 美观），message 详细（实际发给 agent 的 prompt）
    return [
        {
            title: '月度餐单',
            message: `请为我的 ${typeLabel}「${pet.name}」（品种：${breed}，${ageDesc}，${weightDesc}）设计一份月度营养餐计划。`,
        },
        {
            title: '健康风险',
            message: `${pet.name} 当前健康状况：${pet.health_status || '健康'}。请帮我分析饮食上需要注意的事项。`,
        },
        {
            title: '替代食材',
            message: `${pet.name} 不喜欢吃某些常见食材，能推荐几种营养相近的替代品吗？`,
        },
    ];
}

/**
 * 内层 chat body：必须在 CopilotKitProvider 内才能调 useAgent / useConfigureSuggestions
 */
function ChatBody({ pet }) {
    // v2 hook：拿到 agent 运行状态用于顶部状态指示
    const agentState = useAgent({ agentId: AGUI_AGENT_NAME });
    const isRunning = agentState?.isRunning ?? false;

    // 根据当前宠物动态拼建议；available='before-first-message' 让首屏可见，发出后自动隐藏
    useConfigureSuggestions({
        suggestions: buildSuggestions(pet),
        available: 'before-first-message',
    });

    return (
        <>
            {/* 状态指示条：与项目其他页面顶部 sub-header 风格一致 */}
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-text-muted-light dark:text-text-muted-dark border-b border-gray-100/80 dark:border-gray-800/60 bg-background-light/60 dark:bg-background-dark/40">
                <span
                    className={`inline-block w-2 h-2 rounded-full transition-colors ${
                        isRunning
                            ? 'bg-primary animate-pulse shadow-glow'
                            : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                />
                <span className="font-medium">
                    {isRunning ? 'Agent 工作中...' : 'Agent 就绪'}
                </span>
                {pet && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">
                        ctx: {pet.name}
                    </span>
                )}
                <span className="ml-auto font-mono opacity-60 text-[10px]">
                    {AGUI_AGENT_NAME}
                </span>
            </div>

            {/* CopilotChat slot 用法：
                - className: 外层容器
                - labels: 部分文案中文化（key 不存在的 fallback 到内置默认） */}
            <CopilotChat
                agentId={AGUI_AGENT_NAME}
                className="flex-1 min-h-0"
                labels={{
                    chatInputPlaceholder: pet
                        ? `问问关于 ${pet.name} 的饮食...`
                        : '问问营养饮食...',
                    chatDisclaimerText: '回答由 AI 生成，仅作参考',
                    stopGenerating: '停止',
                    regenerateResponse: '重新生成',
                    copyToClipboard: '复制',
                    thumbsUp: '不错',
                    thumbsDown: '不准确',
                }}
            />
        </>
    );
}

/**
 * AG-UI 实验台页面
 *
 * 设计要点：
 * 1. v2 直连模式：agents__unsafe_dev_only 提供 ContextualHttpAgent，
 *    CopilotKitProvider 不再强制 publicApiKey/runtimeUrl（hasLocalAgents 例外）。
 * 2. 业务上下文（宠物信息）通过 `agent.setForwardedProps({ pet_information })` 注入；
 *    后端 DataclassAwareLangGraphAGUIAgent 在 get_stream_kwargs 把它合并进 ContextV2，
 *    与现有 SSE 食谱制定流程（plan_service）共享同一份运行时 context。
 * 3. inspector / dev banner 默认关闭，附 ?dev=1 才开启（避免遮挡顶栏）。
 */
export default function AGUITest() {
    const navigate = useNavigate();
    const { currentPet } = usePets();
    const { user } = useUser();
    const [searchParams] = useSearchParams();
    const devMode = searchParams.get('dev') === '1';

    // agent 实例只构造一次（threadId/messages 等内部状态绑在它身上，重建会丢历史）。
    // 工厂返回 { agent, setForwardedProps }：闭包共享 props box，clone 实例自动看到最新值。
    const { agent, setForwardedProps } = useMemo(
        () => createContextualHttpAgent({ url: `${AGUI_BASE_URL}/langgraph` }),
        []
    );

    // 把当前选中的宠物信息映射为后端 PetInformation 字段，注入到 forwardedProps。
    // 由于工厂的 box 是闭包共享的，setForwardedProps 之后所有 clone 实例都立刻可见。
    useEffect(() => {
        const petInformation = petToInformation(currentPet);
        setForwardedProps({
            ...(petInformation ? { pet_information: petInformation } : {}),
            ...(user?.id ? { user_id: String(user.id) } : {}),
        });
    }, [setForwardedProps, currentPet, user?.id]);

    return (
        <div
            className="min-h-[100dvh] flex flex-col bg-background-light dark:bg-background-dark"
            style={cpkThemeStyle}
        >
            <header className="px-4 pt-12 pb-3 flex items-center justify-between bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100/60 dark:border-gray-800/60">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors shrink-0"
                        aria-label="返回"
                    >
                        <span className="material-icons-round text-lg">arrow_back</span>
                    </button>
                    {currentPet && (
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-sm font-bold shrink-0">
                            {currentPet.avatar_url ? (
                                <SecureImage
                                    src={currentPet.avatar_url}
                                    alt={currentPet.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                currentPet.name?.charAt(0) || '?'
                            )}
                        </div>
                    )}
                    <div className="leading-tight min-w-0">
                        <h1 className="text-base font-bold flex items-center gap-1.5">
                            <span className="truncate">AG-UI 实验台</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-semibold shrink-0">
                                v2
                            </span>
                            {devMode && (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-600 text-[10px] font-semibold shrink-0">
                                    dev
                                </span>
                            )}
                        </h1>
                        <p className="text-[11px] text-text-muted-light dark:text-text-muted-dark truncate">
                            {currentPet
                                ? `当前宠物：${currentPet.name}`
                                : `agent: ${AGUI_AGENT_NAME}`}
                        </p>
                    </div>
                </div>
                <Link
                    to="/plan/create"
                    className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors shrink-0"
                    aria-label="返回创建计划"
                >
                    返回
                </Link>
            </header>

            <CopilotKitProvider
                agents__unsafe_dev_only={{ [AGUI_AGENT_NAME]: agent }}
                showDevConsole={devMode}
            >
                <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <ChatBody pet={currentPet} />
                </main>
            </CopilotKitProvider>
        </div>
    );
}
