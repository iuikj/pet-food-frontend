import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars -- motion used via JSX
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
    ConversationEmptyState,
} from '@/components/ai-elements/conversation';
import { Sparkles } from 'lucide-react';
import WidgetSwitch from './EventStream/WidgetSwitch';
import WeekParallelBlock from './WeekParallelBlock';
import SubAgentParallelBlock from './SubAgentParallelBlock';
import ToolGroupChip, { isCoTEvent, isMainStreamElement, isTaskDispatchToolEvent } from './ToolGroupChip';
import ToolGroupSheet from './ToolGroupSheet';
import FanoutDetailView from './FanoutDetailView';
import { organizeEventsForTimeline, eventKey } from '../../utils/aguiPlanEvents';
import { useFanoutDetail } from '@/hooks/useFanoutDetail';

function WorkflowEventRow({ item }) {
    return (
        <motion.div
            className="agui-timeline-item"
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
        >
            <div className="min-w-0 flex-1">
                <WidgetSwitch event={item} />
            </div>
        </motion.div>
    );
}

function buildCoTBlocks(stream) {
    const result = [];
    let cotBuffer = [];

    function flushCoT() {
        if (cotBuffer.length > 0) {
            result.push({ _kind: 'cot_block', events: [...cotBuffer] });
            cotBuffer = [];
        }
    }

    for (const item of stream) {
        // SubAgent 已通过 fanout 块渲染；过滤掉原始 task 工具调用，避免主流再出现单条卡。
        if (isTaskDispatchToolEvent(item)) {
            continue;
        }
        if (item._kind === 'week_block' || item._kind === 'subagent_block') {
            flushCoT();
            result.push(item);
            continue;
        }
        if (isMainStreamElement(item)) {
            flushCoT();
            result.push(item);
            continue;
        }
        if (isCoTEvent(item)) {
            cotBuffer.push(item);
            continue;
        }
        flushCoT();
        result.push(item);
    }
    flushCoT();
    return result;
}

export default function TimelineFeed({ events, emptyText, compact = false, disableNestedBlocks = false }) {
    const [sheetEvents, setSheetEvents] = useState(null);
    // PR3 grill #8 修复：详情页内的 TimelineFeed 必须直接铺平 events 渲染，
    // 不再二次拆解出 week_block / subagent_block，否则详情页会再渲染一张同款 fanout 卡。
    const { mainStream, weekBuckets, weekCards, subagentBuckets, subagentCards } = useMemo(() => {
        if (disableNestedBlocks) {
            return {
                mainStream: events || [],
                weekBuckets: {},
                weekCards: [],
                subagentBuckets: {},
                subagentCards: [],
            };
        }
        return organizeEventsForTimeline(events || [], { nested: compact });
    }, [compact, disableNestedBlocks, events]);

    const aggregated = useMemo(() => buildCoTBlocks(mainStream), [mainStream]);

    const lastIsCoT = aggregated.length > 0 && aggregated[aggregated.length - 1]?._kind === 'cot_block';

    // 详情页（compact / disableNestedBlocks 嵌套实例不再启用）。
    // 顶层主流唯一持有详情状态；嵌套实例 enabled=false 时 hook 内不订阅 popstate / backButton。
    const fanoutEnabled = !disableNestedBlocks && !compact;
    const { detailCard, openDetail, closeDetail } = useFanoutDetail({ enabled: fanoutEnabled });
    const detailEvents = useMemo(() => {
        if (!detailCard) return [];
        if (detailCard.kind === 'sub') return subagentBuckets?.[detailCard.id] || [];
        if (detailCard.kind === 'week') return weekBuckets?.[detailCard.id] || [];
        return [];
    }, [detailCard, subagentBuckets, weekBuckets]);

    if (aggregated.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <ConversationEmptyState
                    className="text-gray-400 dark:text-gray-500"
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
                <ConversationContent className="gap-3 px-4 py-4">
                    <AnimatePresence initial={false}>
                        {aggregated.map((item, idx) => {
                            if (item._kind === 'cot_block') {
                                const isLast = idx === aggregated.length - 1;
                                return (
                                    <motion.div
                                        key={`cot-${idx}`}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        <ToolGroupChip
                                            events={item.events}
                                            onExpand={(evts) => setSheetEvents(evts)}
                                            isStreaming={isLast && lastIsCoT}
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
                                        <WeekParallelBlock
                                            buckets={weekBuckets}
                                            cards={weekCards}
                                            openDetail={openDetail}
                                        />
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
                                    >
                                        <SubAgentParallelBlock
                                            cards={subagentCards}
                                            buckets={subagentBuckets}
                                            openDetail={openDetail}
                                        />
                                    </motion.div>
                                );
                            }
                            // 兜底：极端情况下若 task 工具事件漏过 buildCoTBlocks 过滤，再阻拦一次。
                            if (isTaskDispatchToolEvent(item)) return null;
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
                allEvents={events || []}
                onClose={() => setSheetEvents(null)}
            />

            <AnimatePresence>
                {fanoutEnabled && detailCard && (
                    <FanoutDetailView
                        key={`${detailCard.kind}-${detailCard.id}`}
                        card={detailCard}
                        events={detailEvents}
                        allEvents={events || []}
                        onClose={closeDetail}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
