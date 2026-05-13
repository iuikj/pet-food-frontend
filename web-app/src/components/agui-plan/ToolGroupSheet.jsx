import {
    X,
    FileText,
    Search,
    FolderOpen,
    Pencil,
    ListChecks,
    Brain,
    FlaskConical,
    CheckCircle2,
    Circle,
    Loader2,
} from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { registerBackButtonHandler } from '@/hooks/useBackButton';
import {
    Drawer,
    DrawerClose,
    DrawerHeader,
    DrawerPanel,
    DrawerPopup,
    DrawerTitle,
} from '@/components/ui/drawer';
import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import {
    isReasoningEvent,
    isPlanBoardEvent,
    isPhaseMarkerEvent,
    isTaskDispatchToolEvent,
} from './ToolGroupChip';
import { toAiSdkSources } from '@/lib/aiElementsAdapter';

// === Step 映射常量 ===

const READ_TOOLS = new Set(['read_file', 'file_read', 'query_note', 'query_shared_note']);
const BROWSE_TOOLS = new Set(['ls', 'list_directory', 'list_dir', 'glob']);
const SEARCH_TOOLS = new Set([
    'tavily_search',
    'ingredient_search_tool',
    'grep',
    'grep_search',
    'file_search',
    'search',
]);
const WRITE_TOOLS = new Set([
    'write_file',
    'edit_file',
    'write_note',
    'week_write_note',
    'update_note',
]);
const FOOD_CALC_LABELS = {
    ingredient_detail_tool: '食材详情查询',
    nutrition_requirement_tool: '营养需求计算',
    daily_calorie_tool: '每日热量计算',
    ingredient_categories_tool: '食材分类查询',
};

const SEARCH_RESULTS_MAX = 8;

const STATUS_MAP = {
    completed: 'complete',
    started: 'active',
    error: 'pending',
};

// === Helpers ===

function basenameOf(p) {
    if (!p || typeof p !== 'string') return '';
    const trimmed = p.replace(/[\\/]+$/, '');
    const idx = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
    return idx >= 0 ? trimmed.slice(idx + 1) : trimmed;
}

function summarizeQuery(q, max = 24) {
    if (!q || typeof q !== 'string') return '';
    return q.length > max ? `${q.slice(0, max - 1)}…` : q;
}

function hostnameOf(url) {
    if (!url) return '';
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function pickSourceLabel(src) {
    // adapter 的 title 可能 fallback 到 url 原文;此时退化为 hostname,避免 Badge 显示完整 url
    if (src.title && src.title !== src.url) return src.title;
    return hostnameOf(src.url);
}

function resolveStepStatus(rawStatus) {
    return STATUS_MAP[rawStatus] || 'complete';
}

function appendFailedSuffix(label, rawStatus) {
    return rawStatus === 'error' ? `${label}（失败）` : label;
}

function mergeConsecutiveReasoning(events) {
    const out = [];
    let buffer = null;
    const flush = () => {
        if (!buffer) return;
        out.push(buffer);
        buffer = null;
    };
    for (const ev of events) {
        if (isPhaseMarkerEvent(ev)) continue;
        if (isTaskDispatchToolEvent(ev)) continue;
        if (isReasoningEvent(ev)) {
            const raw = (ev.detail?.content || ev.message || '').trim();
            if (!raw) continue;
            // 规范化：trim + 折叠 3+ 换行为 2
            const normalized = raw.replace(/\n{3,}/g, '\n\n');
            if (buffer) {
                const prev = buffer.detail?.content || buffer.message || '';
                buffer = {
                    ...buffer,
                    detail: {
                        ...(buffer.detail || {}),
                        content: prev ? `${prev}\n\n${normalized}` : normalized,
                    },
                };
            } else {
                buffer = {
                    ...ev,
                    detail: { ...(ev.detail || {}), content: normalized },
                };
            }
            continue;
        }
        flush();
        out.push(ev);
    }
    flush();
    return out;
}

// === 事件 → Step 映射（单一函数，避免 if-else 长链）===
// allEvents 用于 toAiSdkSources 在当前 event 没 result 时按 call_id 回查兄弟事件（PR3 方案 A 兜底）

function mapEventToStep(event, allEvents) {
    if (isReasoningEvent(event)) {
        const text = event.detail?.content || event.message || '';
        const isStreaming = !!event.detail?.is_streaming;
        // PR2 ADR-002：sheet 内 reasoning 用 ai-elements <Reasoning> 取代静态 span
        // 外层保留 ChainOfThoughtStep 容器（Brain 图标 + "思考过程" label），children 注入 Reasoning 折叠器
        return {
            icon: Brain,
            label: isStreaming ? '思考过程（推理中…）' : '思考过程',
            status: isStreaming ? 'active' : 'complete',
            children: (
                <Reasoning className="agui-reasoning w-full" isStreaming={isStreaming} defaultOpen>
                    <ReasoningTrigger />
                    <ReasoningContent>{text}</ReasoningContent>
                </Reasoning>
            ),
            keyHint: 'reasoning',
        };
    }

    if (isPlanBoardEvent(event)) {
        const items = event.detail?.items || [];
        return {
            icon: ListChecks,
            label: '任务列表更新',
            status: 'complete',
            children: <PlanBoardChildren items={items} />,
            keyHint: 'plan_board',
        };
    }

    const toolName = event.detail?.tool_name || '';
    const args = event.detail?.args || {};
    const rawStatus = event.detail?.status;
    const status = resolveStepStatus(rawStatus);

    if (READ_TOOLS.has(toolName)) {
        const target = basenameOf(args.path || args.file_path || args.filename || args.note_name || '');
        return {
            icon: FileText,
            label: appendFailedSuffix(`读取文件 ${target || toolName}`, rawStatus),
            status,
            children: null,
            keyHint: toolName,
        };
    }

    if (BROWSE_TOOLS.has(toolName)) {
        const target = args.path || args.directory || args.pattern || '';
        return {
            icon: FolderOpen,
            label: appendFailedSuffix(`浏览目录 ${target || toolName}`, rawStatus),
            status,
            children: null,
            keyHint: toolName,
        };
    }

    if (SEARCH_TOOLS.has(toolName)) {
        const query = summarizeQuery(args.query || args.pattern || args.search_term || '');
        // PR3：传入 allEvents，让 toAiSdkSources 在 event.detail.result 缺失时按 call_id 回查兄弟事件
        const sources = toAiSdkSources(event, allEvents);
        return {
            icon: Search,
            label: appendFailedSuffix(query ? `已搜索 "${query}"` : '搜索', rawStatus),
            status,
            children: <SearchSourcesChildren sources={sources} />,
            keyHint: toolName,
        };
    }

    if (WRITE_TOOLS.has(toolName)) {
        const target = basenameOf(args.path || args.file_path || args.note_name || '');
        return {
            icon: Pencil,
            label: appendFailedSuffix(`写入/编辑 ${target || toolName}`, rawStatus),
            status,
            children: null,
            keyHint: toolName,
        };
    }

    if (FOOD_CALC_LABELS[toolName]) {
        return {
            icon: FlaskConical,
            label: appendFailedSuffix(FOOD_CALC_LABELS[toolName], rawStatus),
            status,
            children: null,
            keyHint: toolName,
        };
    }

    // 未在映射表中的工具：兜底
    return {
        icon: FileText,
        label: appendFailedSuffix(toolName || '工具调用', rawStatus),
        status,
        children: null,
        keyHint: toolName || 'unknown',
    };
}

// === Children 子组件 ===

function PlanBoardChildren({ items }) {
    if (!items || items.length === 0) return null;
    const visible = items.slice(0, 8);
    return (
        <div className="space-y-0.5 pt-1">
            {visible.map((item, i) => {
                const done = item.status === 'done' || item.status === 'completed';
                const active = item.status === 'in_progress' || item.status === 'active';
                return (
                    <div key={item.id ?? i} className="flex items-center gap-1.5 text-[11px]">
                        {done ? (
                            <CheckCircle2 className="size-3 shrink-0 text-gray-400 dark:text-gray-500" />
                        ) : active ? (
                            <Loader2 className="size-3 shrink-0 animate-spin text-gray-400 dark:text-gray-500" />
                        ) : (
                            <Circle className="size-3 shrink-0 text-gray-300 dark:text-gray-600" />
                        )}
                        <span className={cn('truncate', done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-600 dark:text-gray-400')}>
                            {item.description || item.content || ''}
                        </span>
                    </div>
                );
            })}
            {items.length > visible.length && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500">…还有 {items.length - visible.length} 项</span>
            )}
        </div>
    );
}

function SearchSourcesChildren({ sources }) {
    if (!sources || sources.length === 0) return null;
    const visible = sources.slice(0, SEARCH_RESULTS_MAX);
    const remaining = sources.length - visible.length;
    return (
        <Sources>
            <SourcesTrigger count={sources.length} />
            <SourcesContent>
                {visible.map((src, i) => (
                    <Source
                        key={src.url || i}
                        href={src.url}
                        title={pickSourceLabel(src)}
                    />
                ))}
                {remaining > 0 && (
                    <span className="block text-[11px] text-gray-400 dark:text-gray-500">
                        …还有 {remaining} 项
                    </span>
                )}
            </SourcesContent>
        </Sources>
    );
}

// === Sheet 主组件 ===

// === Sheet 主组件 ===

export default function ToolGroupSheet({ open, events = [], allEvents, onClose }) {
    const merged = mergeConsecutiveReasoning(events).filter(
        (ev) => !isPhaseMarkerEvent(ev) && !isTaskDispatchToolEvent(ev),
    );
    // 详情页传入 allEvents（task 全量事件，含 mainStream + 所有 buckets）；主流页未传时退化为 events
    const lookupPool = Array.isArray(allEvents) ? allEvents : events;

    useEffect(() => {
        if (!open) return undefined;
        return registerBackButtonHandler(() => {
            onClose?.();
            return true;
        });
    }, [open, onClose]);

    return (
        <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()} position="bottom">
            <DrawerPopup
                className="mx-auto max-w-[430px] bg-white dark:bg-gray-900 [--drawer-height:75vh]"
                showBar
            >
                <DrawerHeader className="grid grid-cols-[40px_1fr_40px] items-center border-b border-gray-100 px-2 py-3 dark:border-gray-800">
                    <span aria-hidden className="block size-8" />
                    <DrawerTitle className="text-center text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                        详情
                    </DrawerTitle>
                    <DrawerClose
                        aria-label="关闭详情"
                        className="ml-auto text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-800"
                        render={<Button size="icon-sm" variant="ghost" />}
                    >
                        <X className="size-4" />
                    </DrawerClose>
                </DrawerHeader>

                <DrawerPanel className="px-4 py-3" scrollFade={false}>
                    {merged.length === 0 ? (
                        <p className="py-6 text-center text-[13px] text-gray-400 dark:text-gray-500">暂无事件</p>
                    ) : (
                        <ChainOfThought defaultOpen>
                            <ChainOfThoughtContent>
                                {merged.map((ev, i) => {
                                    const step = mapEventToStep(ev, lookupPool);
                                    const key =
                                        ev.detail?.call_id ||
                                        ev.detail?.message_id ||
                                        `${step.keyHint}-${i}`;
                                    return (
                                        <ChainOfThoughtStep
                                            key={key}
                                            icon={step.icon}
                                            label={step.label}
                                            status={step.status}
                                        >
                                            {step.children}
                                        </ChainOfThoughtStep>
                                    );
                                })}
                            </ChainOfThoughtContent>
                        </ChainOfThought>
                    )}
                </DrawerPanel>
            </DrawerPopup>
        </Drawer>
    );
}
