import { useMemo, useState } from 'react';
import { ChevronRight, FileText, Search, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 工具名 → 中文标签 + 聚合 key 映射
 */
const TOOL_AGGREGATE_MAP = {
    read_file: { key: 'read', label: '读取', icon: FileText },
    file_read: { key: 'read', label: '读取', icon: FileText },
    list_directory: { key: 'browse', label: '浏览', icon: FolderOpen },
    list_dir: { key: 'browse', label: '浏览', icon: FolderOpen },
    grep_search: { key: 'search', label: '搜索', icon: Search },
    file_search: { key: 'search', label: '搜索', icon: Search },
    search: { key: 'search', label: '搜索', icon: Search },
};

const AGGREGATE_LABELS = {
    read: (n) => `读取 ${n} 个文件`,
    browse: (n) => `浏览 ${n} 个目录`,
    search: (n) => `搜索 ${n} 次`,
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
 * 从一组工具事件生成聚合摘要文本
 */
function buildSummary(events) {
    const counts = {};
    for (const ev of events) {
        const toolName = ev.detail?.tool_name;
        const mapping = TOOL_AGGREGATE_MAP[toolName];
        if (mapping) {
            counts[mapping.key] = (counts[mapping.key] || 0) + 1;
        }
    }
    const parts = [];
    // 固定顺序：browse → read → search
    for (const key of ['browse', 'read', 'search']) {
        if (counts[key]) {
            parts.push(AGGREGATE_LABELS[key](counts[key]));
        }
    }
    return parts.join('，');
}

/**
 * ToolGroupChip — 聚合多个高频工具调用为一行 chip。
 * 点击展开 ToolGroupSheet 查看详情。
 */
export default function ToolGroupChip({ events, onExpand, className }) {
    const summary = useMemo(() => buildSummary(events), [events]);

    if (!summary) return null;

    return (
        <button
            type="button"
            onClick={() => onExpand?.(events)}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
                'text-[13px] text-gray-500 hover:text-gray-700',
                'border border-gray-100 hover:border-gray-200',
                'transition-colors cursor-pointer bg-transparent',
                className,
            )}
        >
            <FileText className="size-3.5 shrink-0" />
            <span className="truncate">{summary}</span>
            <ChevronRight className="size-3 shrink-0 text-gray-400" />
        </button>
    );
}
