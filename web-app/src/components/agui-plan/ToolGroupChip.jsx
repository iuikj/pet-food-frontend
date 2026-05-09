import { useMemo } from 'react';
import { ChevronRight, FileText, Search, FolderOpen, Pencil, ListChecks, Brain, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOOL_AGGREGATE_MAP = {
    read_file: { key: 'read', icon: FileText },
    file_read: { key: 'read', icon: FileText },
    ls: { key: 'browse', icon: FolderOpen },
    list_directory: { key: 'browse', icon: FolderOpen },
    list_dir: { key: 'browse', icon: FolderOpen },
    glob: { key: 'browse', icon: FolderOpen },
    grep_search: { key: 'search', icon: Search },
    grep: { key: 'search', icon: Search },
    file_search: { key: 'search', icon: Search },
    search: { key: 'search', icon: Search },
    tavily_search: { key: 'search', icon: Search },
    ingredient_search_tool: { key: 'search', icon: Search },
    write_file: { key: 'write', icon: Pencil },
    edit_file: { key: 'write', icon: Pencil },
    write_todos: { key: 'plan', icon: ListChecks },
    update_todos: { key: 'plan', icon: ListChecks },
    query_note: { key: 'read', icon: FileText },
    query_shared_note: { key: 'read', icon: FileText },
    write_note: { key: 'write', icon: Pencil },
    week_write_note: { key: 'write', icon: Pencil },
    update_note: { key: 'write', icon: Pencil },
};

const AGGREGATE_LABELS = {
    browse: (n) => `已浏览 ${n} 个目录`,
    read: (n) => `已读取 ${n} 个文件`,
    search: (n) => `已搜索 ${n} 次`,
    write: (n) => `已编辑 ${n} 个文件`,
    plan: () => `已更新任务列表`,
};

const AGGREGATE_ICONS = {
    browse: FolderOpen,
    read: FileText,
    search: Search,
    write: Pencil,
    plan: ListChecks,
};

export function isCoTEvent(event) {
    if (isReasoningEvent(event)) return true;
    if (isAggregatableTool(event)) return true;
    if (isPlanBoardEvent(event)) return true;
    if (isPhaseMarkerEvent(event)) return true;
    return false;
}

export function isAggregatableTool(event) {
    const viewType = event.detail?.view_type;
    const toolName = event.detail?.tool_name;
    if (viewType?.startsWith('tool_') || event.type === 'tool_call') {
        return !!TOOL_AGGREGATE_MAP[toolName];
    }
    return false;
}

export function isReasoningEvent(event) {
    return event.detail?.view_type === 'reasoning' || event.type === 'reasoning';
}

export function isPlanBoardEvent(event) {
    return event.detail?.view_type === 'plan_board' || event.type === 'plan_snapshot';
}

export function isPhaseMarkerEvent(event) {
    return event.detail?.view_type === 'phase_marker' || event.type === 'phase_marker';
}

export function isMainStreamElement(event) {
    if (event._kind === 'week_block' || event._kind === 'subagent_block') return true;
    const viewType = event.detail?.view_type;
    if (viewType === 'ai_message') return true;
    if (event.type === 'ai_message') return true;
    return false;
}

export function buildSummaryLines(events) {
    const counts = {};
    for (const ev of events) {
        if (isReasoningEvent(ev) || isPlanBoardEvent(ev) || isPhaseMarkerEvent(ev)) continue;
        const toolName = ev.detail?.tool_name;
        const mapping = TOOL_AGGREGATE_MAP[toolName];
        if (mapping) {
            counts[mapping.key] = (counts[mapping.key] || 0) + 1;
        }
    }
    const lines = [];
    for (const key of ['browse', 'read', 'search', 'write', 'plan']) {
        if (counts[key]) {
            lines.push({
                key,
                label: AGGREGATE_LABELS[key](counts[key]),
                icon: AGGREGATE_ICONS[key],
                count: counts[key],
            });
        }
    }
    return lines;
}

export function getToolIcon(toolName) {
    return TOOL_AGGREGATE_MAP[toolName]?.icon || FileText;
}

export default function ToolGroupChip({ events, onExpand, isStreaming = false, className }) {
    const lines = useMemo(() => buildSummaryLines(events), [events]);
    const hasReasoning = useMemo(() => events.some(isReasoningEvent), [events]);

    if (lines.length === 0 && !hasReasoning) return null;

    return (
        <button
            type="button"
            onClick={() => onExpand?.(events)}
            className={cn(
                'flex w-full flex-col gap-0.5 rounded-lg px-3 py-2',
                'text-left text-[13px] text-gray-500',
                'hover:bg-gray-50 transition-colors cursor-pointer',
                className,
            )}
        >
            {hasReasoning && (
                <div className="flex items-center gap-2">
                    <Brain className="size-3.5 shrink-0 text-gray-400" />
                    <span className="flex-1 truncate">思考过程</span>
                    {isStreaming && (
                        <Loader2 className="size-3 shrink-0 animate-spin text-gray-400" />
                    )}
                </div>
            )}
            {lines.map((line) => {
                const Icon = line.icon;
                return (
                    <div key={line.key} className="flex items-center gap-2">
                        <Icon className="size-3.5 shrink-0 text-gray-400" />
                        <span className="flex-1 truncate">{line.label}</span>
                    </div>
                );
            })}
            <div className="flex items-center justify-end pt-0.5">
                <ChevronRight className="size-3 text-gray-300" />
            </div>
        </button>
    );
}
