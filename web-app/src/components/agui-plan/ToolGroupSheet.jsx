import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
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
import { cn } from '@/lib/utils';
import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import {
    isReasoningEvent,
    isPlanBoardEvent,
    isPhaseMarkerEvent,
    isTaskDispatchToolEvent,
} from './ToolGroupChip';
import { toAiSdkSources } from '@/lib/aiElementsAdapter';

const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const panelVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 320 } },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
};

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

function mapEventToStep(event) {
    if (isReasoningEvent(event)) {
        const text = event.detail?.content || event.message || '';
        return {
            icon: Brain,
            label: (
                <span className="whitespace-pre-wrap text-muted-foreground">
                    {text}
                </span>
            ),
            status: 'complete',
            children: null,
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
        const sources = toAiSdkSources(event);
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
                            <CheckCircle2 className="size-3 shrink-0 text-gray-400" />
                        ) : active ? (
                            <Loader2 className="size-3 shrink-0 animate-spin text-gray-400" />
                        ) : (
                            <Circle className="size-3 shrink-0 text-gray-300" />
                        )}
                        <span className={cn('truncate', done ? 'text-gray-400 line-through' : 'text-gray-600')}>
                            {item.description || item.content || ''}
                        </span>
                    </div>
                );
            })}
            {items.length > visible.length && (
                <span className="text-[11px] text-gray-400">…还有 {items.length - visible.length} 项</span>
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
                    <span className="block text-[11px] text-gray-400">
                        …还有 {remaining} 项
                    </span>
                )}
            </SourcesContent>
        </Sources>
    );
}

// === Sheet 主组件 ===

// === Sheet 主组件 ===

const SHEET_HEIGHT_VH = 75;
const CLOSE_OFFSET_PX = 80;
const CLOSE_VELOCITY_PX_S = 500;

function useBodyScrollLock(active) {
    useEffect(() => {
        if (!active) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [active]);
}

export default function ToolGroupSheet({ open, events = [], onClose }) {
    const merged = mergeConsecutiveReasoning(events).filter(
        (ev) => !isPhaseMarkerEvent(ev) && !isTaskDispatchToolEvent(ev),
    );

    useBodyScrollLock(open);

    const handleDragEnd = (_e, info) => {
        if (info.offset.y > CLOSE_OFFSET_PX || info.velocity.y > CLOSE_VELOCITY_PX_S) {
            onClose?.();
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-2xl bg-white"
                        style={{ height: `${SHEET_HEIGHT_VH}vh` }}
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        dragMomentum={false}
                        onDragEnd={handleDragEnd}
                    >
                        {/* 拖拽区:把手 + 居中标题 + 关闭按钮 */}
                        <div className="cursor-grab touch-none select-none active:cursor-grabbing">
                            <div className="flex justify-center pt-2 pb-1">
                                <div className="h-1 w-9 rounded-full bg-gray-300" />
                            </div>
                            <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-gray-100 px-2 py-2">
                                <span aria-hidden className="block size-8" />
                                <h3 className="text-center text-[15px] font-semibold text-gray-900">
                                    详情
                                </h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="ml-auto flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
                                    aria-label="关闭详情"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>

                        {/* 内容区:独立 scroll,overscroll 不穿透 */}
                        <div
                            className="flex-1 overflow-y-auto px-4 py-3"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {merged.length === 0 ? (
                                <p className="py-6 text-center text-[13px] text-gray-400">暂无事件</p>
                            ) : (
                                <ChainOfThought defaultOpen>
                                    <ChainOfThoughtContent>
                                        {merged.map((ev, i) => {
                                            const step = mapEventToStep(ev);
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
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
