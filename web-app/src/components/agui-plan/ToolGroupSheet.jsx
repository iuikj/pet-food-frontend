import { createElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { X, FileText, Search, FolderOpen, Pencil, ListChecks, Brain, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isReasoningEvent, isPlanBoardEvent, getToolIcon } from './ToolGroupChip';

const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const panelVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 320 } },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
};

const TOOL_LABEL_MAP = {
    read_file: '读取文件',
    file_read: '读取文件',
    ls: '浏览目录',
    list_directory: '浏览目录',
    list_dir: '浏览目录',
    glob: '搜索文件',
    grep_search: '搜索内容',
    grep: '搜索内容',
    file_search: '搜索文件',
    search: '搜索',
    tavily_search: '网络搜索',
    ingredient_search_tool: '食材搜索',
    write_file: '写入文件',
    edit_file: '编辑文件',
    write_todos: '更新任务列表',
    update_todos: '更新任务列表',
    query_note: '查阅笔记',
    query_shared_note: '查阅共享笔记',
    write_note: '写入笔记',
    week_write_note: '写入周笔记',
    update_note: '更新笔记',
};

function toolArgSummary(event) {
    const args = event.detail?.args || {};
    const toolName = event.detail?.tool_name || '';
    if (toolName.includes('read') || toolName.includes('query') || toolName === 'ls' || toolName === 'glob') {
        return args.path || args.file_path || args.directory || args.pattern || '';
    }
    if (toolName.includes('grep') || toolName.includes('search')) {
        const q = args.query || args.pattern || args.search_term || '';
        const scope = args.path || args.directory || '';
        return scope ? `"${q}" in ${scope}` : q ? `"${q}"` : '';
    }
    if (toolName.includes('write') || toolName.includes('edit') || toolName.includes('update')) {
        return args.path || args.file_path || args.note_name || '';
    }
    if (toolName === 'write_todos' || toolName === 'update_todos') {
        const todos = args.todos || args.plan || [];
        return `${todos.length} 项任务`;
    }
    return '';
}

function ReasoningItem({ event }) {
    const text = (event.detail?.content || event.message || '').trim();
    if (!text) return null;
    return (
        <div className="py-2">
            <div className="mb-1 flex items-center gap-2">
                <Brain className="size-3.5 shrink-0 text-gray-400" />
                <span className="text-[12px] font-medium text-gray-500">思考过程</span>
            </div>
            <p className="pl-[22px] text-[12px] leading-relaxed text-gray-500">
                {text.length > 300 ? `${text.slice(0, 300)}…` : text}
            </p>
        </div>
    );
}

function PlanBoardItem({ event }) {
    const items = event.detail?.items || [];
    if (items.length === 0) return null;
    return (
        <div className="py-2">
            <div className="mb-1.5 flex items-center gap-2">
                <ListChecks className="size-3.5 shrink-0 text-gray-400" />
                <span className="text-[12px] font-medium text-gray-500">任务列表更新</span>
            </div>
            <div className="space-y-0.5 pl-[22px]">
                {items.slice(0, 8).map((item, i) => {
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
                {items.length > 8 && (
                    <span className="text-[11px] text-gray-400">…还有 {items.length - 8} 项</span>
                )}
            </div>
        </div>
    );
}

function ToolItem({ event }) {
    const toolName = event.detail?.tool_name || '';
    const label = TOOL_LABEL_MAP[toolName] || toolName;
    const summary = toolArgSummary(event);
    const status = event.detail?.status;
    return (
        <div className="flex items-start gap-2 py-1.5">
            {createElement(getToolIcon(toolName), { className: 'mt-0.5 size-3.5 shrink-0 text-gray-400' })}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-gray-600">{label}</span>
                    {status === 'completed' && <CheckCircle2 className="size-3 text-gray-400" />}
                    {status === 'started' && <Loader2 className="size-3 animate-spin text-gray-400" />}
                </div>
                {summary && (
                    <p className="truncate text-[11px] text-gray-400">{summary}</p>
                )}
            </div>
        </div>
    );
}

function isPhaseMarker(event) {
    return event.detail?.view_type === 'phase_marker' || event.type === 'phase_marker';
}

function SheetEventItem({ event }) {
    if (isPhaseMarker(event)) return null;
    if (isReasoningEvent(event)) return <ReasoningItem event={event} />;
    if (isPlanBoardEvent(event)) return <PlanBoardItem event={event} />;
    return <ToolItem event={event} />;
}

export default function ToolGroupSheet({ open, events = [], onClose }) {
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
                        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[80vh] w-full max-w-[430px] overflow-hidden rounded-t-2xl bg-white"
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                            <h3 className="text-[15px] font-semibold text-gray-900">详情</h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(80vh - 56px)' }}>
                            {events.length === 0 ? (
                                <p className="py-6 text-center text-[13px] text-gray-400">暂无事件</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {events.map((ev, i) => (
                                        <SheetEventItem key={ev.detail?.call_id || ev.detail?.message_id || i} event={ev} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
