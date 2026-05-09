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
import SubAgentParallelBlock from './SubAgentParallelBlock';
import ToolGroupChip, { isCoTEvent, isMainStreamElement } from './ToolGroupChip';
import ToolGroupSheet from './ToolGroupSheet';
import { organizeEventsForTimeline, eventKey } from '../../utils/aguiPlanEvents';

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

export default function TimelineFeed({ events, emptyText, compact = false }) {
    const [sheetEvents, setSheetEvents] = useState(null);
    const { mainStream, weekBuckets, weekCards, subagentBuckets, subagentCards } = useMemo(
        () => organizeEventsForTimeline(events || [], { nested: compact }),
        [events, compact],
    );

    const aggregated = useMemo(() => buildCoTBlocks(mainStream), [mainStream]);

    const lastIsCoT = aggregated.length > 0 && aggregated[aggregated.length - 1]?._kind === 'cot_block';

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
                                    >
                                        <SubAgentParallelBlock cards={subagentCards} buckets={subagentBuckets} />
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
