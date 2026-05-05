import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars -- motion used via JSX
import {
    Conversation,
    ConversationContent,
    ConversationDownload,
    ConversationScrollButton,
    ConversationEmptyState,
} from '@/components/ai-elements/conversation';
import { Sparkles } from 'lucide-react';
import WidgetSwitch from './EventStream/WidgetSwitch';
import WeekParallelBlock from './WeekParallelBlock';
import SubAgentParallelBlock from './SubAgentParallelBlock';
import { organizeEventsForTimeline, eventKey } from '../../utils/aguiPlanEvents';

/**
 * 单一 chat-like 时间流 — 重构核心。
 *
 * 渲染逻辑:
 *   - mainStream 项:普通事件 → <WidgetSwitch>;虚拟 {_kind:'week_block'} → 嵌入 <WeekParallelBlock>
 *   - week_agent_N 的事件不进主流 (吸附到 weekBuckets,展开后由子 TimelineFeed 渲染)
 *
 * 布局契约:
 *   - 父容器必须有确定高度且 flex column 上下文 (h-full + min-h-0),否则 Conversation 的 stick-to-bottom 失效
 *   - compact 模式 (嵌入 WeekAgentCard 时) 用 max-h-[50vh] 防止子卡片过高
 */
export default function TimelineFeed({ events, emptyText, compact = false }) {
    const { mainStream, weekBuckets, subagentBuckets, subagentCards } = useMemo(
        () => organizeEventsForTimeline(events || [], { nested: compact }),
        [events, compact]
    );
    const conversationMessages = useMemo(
        () => mainStream
            .filter((item) => item?.detail?.view_type === 'ai_message')
            .map((item) => ({
                id: item.detail?.message_id || eventKey(item),
                role: 'assistant',
                parts: [{ type: 'text', text: item.detail?.content || item.message || '' }],
            })),
        [mainStream],
    );

    if (mainStream.length === 0) {
        return (
            <div className={compact ? 'py-4' : 'flex h-full items-center justify-center py-12'}>
                <ConversationEmptyState
                    icon={<Sparkles className="size-10" />}
                    title={emptyText || '等待事件流...'}
                    description={compact ? null : '点击下方按钮启动 AI 任务'}
                />
            </div>
        );
    }

    return (
        <Conversation className={compact ? 'max-h-[50vh]' : 'h-full'}>
            <ConversationContent className={compact ? 'gap-3 p-2' : 'gap-4 px-1 py-3'}>
                <AnimatePresence initial={false}>
                    {mainStream.map((item) => {
                        if (item._kind === 'week_block') {
                            return (
                                <motion.div
                                    key="week_block"
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                                >
                                    <WeekParallelBlock buckets={weekBuckets} />
                                </motion.div>
                            );
                        }
                        if (item._kind === 'subagent_block') {
                            return (
                                <motion.div
                                    key="subagent_block"
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                                >
                                    <SubAgentParallelBlock cards={subagentCards} buckets={subagentBuckets} />
                                </motion.div>
                            );
                        }
                        return (
                            <motion.div
                                key={eventKey(item)}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18 }}
                            >
                                <WidgetSwitch event={item} />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </ConversationContent>
            {!compact && conversationMessages.length > 0 && (
                <ConversationDownload messages={conversationMessages} />
            )}
            <ConversationScrollButton />
        </Conversation>
    );
}
