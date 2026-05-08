import { AnimatePresence, motion } from 'framer-motion';
import { X, FileText, Search, FolderOpen, Pencil, ListChecks, Eye, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isReasoningEvent, getToolIcon } from './ToolGroupChip';

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
    write_file: '写入文件',
    edit_file: '编辑文件',
    write_todos: '更新任务列表',
};

function getFileIcon(filename) {
    if (!filename) return FileText;
    if (filename.endsWith('/') || !filename.includes('.')) return FolderOpen;
    return FileText;
}

function toolSummaryLine(event) {
    const d = event.detail || {};
    const args = d.args || {};
    const toolName = d.tool_name || '';

    if (toolName === 'read_file' || toolName === 'file_read') {
        return args.path || args.file_path || args.filename || '';
    }
    if (toolName === 'ls' || toolName === 'list_directory' || toolName === 'list_dir') {
        return args.path || args.directory || '';
    }
    if (toolName === 'glob') {
        return args.pattern || args.path || '';
    }
    if (toolName === 'grep_search' || toolName === 'grep' || toolName === 'file_search' || toolName === 'search') {
        const query = args.query || args.pattern || args.search_term || '';
        const scope = args.path || args.directory || '';
        return scope ? `"${query}" in ${scope}` : `"${query}"`;
    }
    if (toolName === 'write_file' || toolName === 'edit_file') {
        return args.path || args.file_path || '';
    }
    if (toolName === 'write_todos') {
        const todos = args.todos || [];
        return `${todos.length} 项任务`;
    }
    return '';
}
