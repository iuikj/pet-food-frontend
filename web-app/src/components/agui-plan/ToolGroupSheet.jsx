import { AnimatePresence, motion } from 'framer-motion';
import { X, FileText, Search, FolderOpen, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOOL_ICON_MAP = {
    read_file: FileText,
    file_read: FileText,
    list_directory: FolderOpen,
    list_dir: FolderOpen,
    grep_search: Search,
    file_search: Search,
    search: Search,
};

const TOOL_LABEL_MAP = {
    read_file: '读取文件',
    file_read: '读取文件',
    list_directory: '浏览目录',
    list_dir: '浏览目录',
    grep_search: '搜索内容',
    file_search: '搜索文件',
    search: '搜索',
};

function toolSummaryLine(event) {
    const d = event.detail || {};
    const args = d.args || {};
    if (d.tool_name === 'read_file' || d.tool_name === 'file_read') {
        return args.path || args.file_path || args.filename || '';
    }
    if (d.tool_name === 'list_directory' || d.tool_name === 'list_dir') {
        return args.path || args.directory || '';
    }
    if (d.tool_name === 'grep_search' || d.tool_name === 'file_search' || d.tool_name === 'search') {
        const query = args.query || args.pattern || args.search_term || '';
        const scope = args.path || args.directory || '';
        return scope ? `"${query}" in ${scope}` : `"${query}"`;
    }
    return JSON.stringify(args).slice(0, 60);
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const sheetVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', damping: 28, stiffness: 320 },
    },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
};

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
                        className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-hidden rounded-t-2xl bg-white"
                        variants={sheetVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                            <h3 className="text-[15px] font-semibold text-gray-900">
                                工具调用详情
                            </h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(60vh - 56px)' }}>
                            <div className="space-y-2">
                                {events.map((ev, i) => {
                                    const toolName = ev.detail?.tool_name || 'unknown';
                                    const Icon = TOOL_ICON_MAP[toolName] || Wrench;
                                    const label = TOOL_LABEL_MAP[toolName] || toolName;
                                    const summary = toolSummaryLine(ev);
                                    return (
                                        <div
                                            key={ev.detail?.call_id || i}
                                            className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-gray-50"
                                        >
                                            <Icon className="mt-0.5 size-4 shrink-0 text-gray-400" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-medium text-gray-700">
                                                    {label}
                                                </p>
                                                {summary && (
                                                    <p className="truncate text-[12px] text-gray-400">
                                                        {summary}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
