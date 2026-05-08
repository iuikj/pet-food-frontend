import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
    ConversationEmptyState,
} from '@/components/ai-elements/conversation';
import { Sparkles } from 'lucide-react';
import WidgetSwitch from './EventStream/WidgetSwitch';
import WeekParallelBlock from './WeekParallelBlock';
import SubAgentCompact from './SubAgentCompact';
import ToolGroupChip, { isAggregatableTool } from './ToolGroupChip';
import ToolGroupSheet from './ToolGroupSheet';
import { organizeEventsForTimeline, eventKey } from '../../utils/aguiPlanEvents';

/**
 * TimelineFeed v2 — 平铺流式布局。
 *
 * 变化：
 *   - 去掉外层「详细工作流」折叠卡片
 *   - 相邻高频工具事件聚合为 ToolGroupChip
 *   - 子 Agent 使用 SubAgentCompact 缩略卡
 *   - 事件直接平铺，无容器背景
 */

function WorkflowEventRow({ item }) {
    return (
        <motion.div
            className="agui-timeline-item"
            initial={{ opacity: 0, y: 7, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
        >
            <div className="min-w-0 flex-1">
                <WidgetSwitch event={item} />
            </div>
        </motion.div>
    );
}

/**
 * 将 mainStream 中相邻的可聚合工具事件合并为 group。
 * 返回混合数组：普通事件 | { _kind: 'tool_group', events: [...] }
 */
function aggregateToolEvents(stream) {
    const result = [];
    let toolBuffer = [];

    function flushBuffer() {
        if (toolBuffer.length > 0) {
            result.push({ _kind: 'tool_group', events: [...toolBuffer] });
            toolBuffer = [];
        }
    }

    for (const item of stream) {
        if (item._kind === 'week_block' || item._kind === 'subagent_block') {
            flushBuffer();
            result.push(item);
            continue;
        }
        if (isAggregatableTool(item)) {
            toolBuffer.push(item);
        } else {
            flushBuffer();
            result.push(item);
        }
    }
    flushBuffer();
    return result;
}

export default function TimelineFeed({ events, emptyText, compact = false }) {
    const [sheetEvents, setSheetEvents] = useState(null);
    const { mainStream, weekBuckets, weekCards, subagentBuckets, subagentCards } = useMemo(
        () => organizeEventsForTimeline(events || [], { nested: compact }),
        [events, compact],
    );

    const visibleStream = useMemo(() => {
        const filtered = [];
        for (const item of mainStream) {
            if (item?.detail?.view_type === 'plan_board') continue;
            filtered.push(item);
        }
        return filtered;
    }, [mainStream]);

    const aggregated = useMemo(() => aggregateToolEvents(visibleStream), [visibleStream]);

    if (aggregated.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <ConversationEmptyState
                    className="text-gray-400"
                    icon={<Sparkles className="size-9" />}
                    title={emptyText || '等待事件流...'}
                    description="工作流事件会在这里出现"
                />
            </div>
        );
    }

    return (
        <>
            <Conversation className="h-full">
                <ConversationContent className="gap-3 px-0 py-4">
                    <AnimatePresence initial={false}>
                        {aggregated.map((item, idx) => {
                            if (item._kind === 'tool_group') {
                                return (
                                    <motion.div
                                        key={`tg-${idx}`}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        <ToolGroupChip
                                            events={item.events}
                                            onExpand={(evts) => setSheetEvents(evts)}
                                        />
                                    </motion.div>
                                );
                            }
                            if (item._kind === 'week_block') {
                                return (
                                    <motion.div
                                        key="week_block"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                                    >
                                        <WeekParallelBlock buckets={weekBuckets} cards={weekCards} />
                                    </motion.div>
                                );
                            }
                            if (item._kind === 'subagent_block') {
                                return (
                                    <motion.div
                                        key="subagent_block"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                                        className="space-y-1"
                                    >
                                        {subagentCards.map((card) => (
                                            <SubAgentCompact
                                                key={card.id}
                                                card={card}
                                                events={subagentBuckets[card.id] || []}
                                                status={card.status}
                                            />
                                        ))}
                                    </motion.div>
                                );
                            }
                            return (
                                <WorkflowEventRow key={eventKey(item)} item={item} />
                            );
                        })}
                    </AnimatePresence>
                </ConversationContent>
                <ConversationScrollButton className="agui-scroll-button" />
            </Conversation>

            <ToolGroupSheet
                open={!!sheetEvents}
                events={sheetEvents || []}
                onClose={() => setSheetEvents(null)}
            />
        </>
    );
}
