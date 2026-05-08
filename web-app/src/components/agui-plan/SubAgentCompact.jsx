import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, Loader2, X as XIcon, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAggregatableTool } from './ToolGroupChip';

const sheetOverlay = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const sheetPanel = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 320 } },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
};

function statusIcon(status) {
    if (status === 'completed') return <Check className="size-3.5 text-gray-400" />;
    if (status === 'error') return <XIcon className="size-3.5 text-red-400" />;
    if (status === 'active' || status === 'in_progress') return <Loader2 className="size-3.5 animate-spin text-gray-500" />;
    return <Circle className="size-3.5 text-gray-300" />;
}

function buildToolSummary(events) {
    let files = 0;
    let tools = 0;
    let reads = 0;
    for (const ev of events) {
        const vt = ev.detail?.view_type;
        if (vt?.startsWith('tool_') || ev.type === 'tool_call') {
            const tn = ev.detail?.tool_name || '';
            if (tn.includes('read') || tn.includes('file')) reads += 1;
            else tools += 1;
        }
    }
    const parts = [];
    if (reads) parts.push(`读取 ${reads} 个文件`);
    if (tools) parts.push(`调用 ${tools} 个工具`);
    return parts.join('，') || null;
}

/**
 * SubAgentCompact — Trae 风格的子 Agent 缩略卡。
 * 默认显示：状态 icon + 任务名（截断）+ 工具摘要 + 展开箭头。
 * 点击展开 sheet 查看完整事件流。
 */
export default function SubAgentCompact({ card, events = [], status }) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const taskName = card?.taskName || '子 Agent 任务';
    const statusKey = status?.key || 'pending';
    const toolSummary = useMemo(() => buildToolSummary(events), [events]);

    return (
        <>
            <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="group flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-gray-50 transition-colors"
            >
                <span className="mt-0.5 shrink-0">{statusIcon(statusKey)}</span>
                <div className="min-w-0 flex-1">
                    <p className={cn(
                        'truncate text-[13px] leading-5',
                        statusKey === 'completed' ? 'text-gray-400' : 'text-gray-700',
                    )}>
                        {taskName}
                    </p>
                    {toolSummary && (
                        <p className="truncate text-[11px] text-gray-400">
                            {toolSummary}
                        </p>
                    )}
                </div>
                <ChevronRight className="mt-1 size-3.5 shrink-0 text-gray-300 group-hover:text-gray-500" />
            </button>

            <AnimatePresence>
                {sheetOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
                            variants={sheetOverlay}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            onClick={() => setSheetOpen(false)}
                        />
                        <motion.div
                            className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-hidden rounded-t-2xl bg-white"
                            variants={sheetPanel}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                <h3 className="truncate text-[15px] font-semibold text-gray-900">
                                    {taskName}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setSheetOpen(false)}
                                    className="flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
                                >
                                    <XIcon className="size-4" />
                                </button>
                            </div>
                            <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(75vh - 56px)' }}>
                                {events.length === 0 ? (
                                    <p className="py-6 text-center text-[13px] text-gray-400">暂无事件</p>
                                ) : (
                                    <div className="space-y-1">
                                        {events.map((ev, i) => (
                                            <div key={ev.detail?.call_id || i} className="text-[12px] text-gray-500 py-1 border-b border-gray-50 last:border-0">
                                                <span className="font-medium text-gray-600">
                                                    {ev.detail?.tool_name || ev.detail?.view_type || ev.type}
                                                </span>
                                                {ev.message && <span className="ml-2 text-gray-400">{ev.message}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
