import { useMemo } from 'react';
import { ChevronRight, FileText, Search, FolderOpen, Pencil, ListChecks, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 工具名 → 聚合 key + icon 映射
 * 覆盖 agent 常用的所有高频工具
 */
const TOOL_AGGREGATE_MAP = {
    // 读取类
    read_file: { key: 'read', icon: FileText },
    file_read: { key: 'read', icon: FileText },
    // 浏览类
    ls: { key: 'browse', icon: FolderOpen },
    list_directory: { key: 'browse', icon: FolderOpen },
    list_dir: { key: 'browse', icon: FolderOpen },
    glob: { key: 'browse', icon: FolderOpen },
    // 搜索类
    grep_search: { key: 'search', icon: Search },
    grep: { key: 'search', icon: Search },
    file_search: { key: 'search', icon: Search },
    search: { key: 'search', icon: Search },
    // 写入/编辑类
    write_file: { key: 'write', icon: Pencil },
    edit_file: { key: 'write', icon: Pencil },
    // 任务管理
    write_todos: { key: 'plan', icon: ListChecks },
};

const AGGREGATE_LABELS = {
    read: (n) => `已读取 ${n} 个文件`,
    browse: (n) => `已浏览 ${n} 个目录`,
    search: (n) => `已搜索 ${n} 次`,
    write: (n) => `已编辑 ${n} 个文件`,
    plan: (n) => `已更新任务列表`,
};

/**
 * 判断事件是否为可聚合的高频工具调用
 */
export function isAggregatableTool(event) {
    const viewType = event.detail?.view_type;
    const toolName = event.detail?.tool_name;
    if (viewType?.startsWith('tool_') || event.type === 'tool_call') {
        return !!TOOL_AGGREGATE_MAP[toolName];
    }
    return false;
}

/**
 * 判断事件是否为 reasoning（也纳入 CoT 聚合）
 */
export function isReasoningEvent(event) {
    return event.detail?.view_type === 'reasoning';
}

/**
 * 从一组工具事件生成聚合摘要行数组
 * 返回 [{ key, label, icon, count }]
 */
export function buildSummaryLines(events) {
    const counts = {};
    for (const ev of events) {
        if (isReasoningEvent(ev)) continue;
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
                icon: key === 'browse' ? FolderOpen
                    : key === 'read' ? FileText
                    : key === 'search' ? Search
                    : key === 'write' ? Pencil
                    : ListChecks,
                count: counts[key],
            });
        }
    }
    return lines;
}

/**
 * 获取工具对应的 icon 组件
 */
export function getToolIcon(toolName) {
    return TOOL_AGGREGATE_MAP[toolName]?.icon || Eye;
}

/**
 * ToolGroupChip — Chain of Thought 聚合行。
 * 显示格式：∞ 已读取 N 个文件
 * 点击展开 CoT sheet。
 */
export default function ToolGroupChip({ events, onExpand, className }) {
    const lines = useMemo(() => buildSummaryLines(events), [events]);
    const hasReasoning = useMemo(() => events.some(isReasoningEvent), [events]);

    if (lines.length === 0 && !hasReasoning) return null;

    return (
        <button
            type="button"
            onClick={() => onExpand?.(events)}
            className={cn(
                'flex w-full flex-col gap-1 rounded-lg px-3 py-2',
                'text-left text-[13px] text-gray-500',
                'hover:bg-gray-50 transition-colors cursor-pointer',
                className,
            )}
        >
            {lines.map((line) => {
                const Icon = line.icon;
                return (
                    <div key={line.key} className="flex items-center gap-2">
                        <Icon className="size-3.5 shrink-0 text-gray-400" />
                        <span className="flex-1 truncate">{line.label}</span>
                    </div>
                );
            })}
            {hasReasoning && (
                <div className="flex items-center gap-2">
                    <Eye className="size-3.5 shrink-0 text-gray-400" />
                    <span className="flex-1 truncate">思考过程</span>
                </div>
            )}
            <div className="flex items-center justify-end">
                <ChevronRight className="size-3 text-gray-300" />
            </div>
        </button>
    );
}
