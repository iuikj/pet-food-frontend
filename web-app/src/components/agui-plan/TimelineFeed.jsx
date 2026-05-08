import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars -- motion used via JSX
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
    ConversationEmptyState,
} from '@/components/ai-elements/conversation';
import { ChevronDown, Sparkles, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';
import WidgetSwitch from './EventStream/WidgetSwitch';
import WeekParallelBlock from './WeekParallelBlock';
import SubAgentParallelBlock from './SubAgentParallelBlock';
import { organizeEventsForTimeline, eventKey } from '../../utils/aguiPlanEvents';

/**
 * 单一 chat-like 时间流 — 重构核心。
 *
 * 渲染逻辑:
 *   - visibleStream 项:普通事件 → <WidgetSwitch>;虚拟 {_kind:'week_block'} → 嵌入 <WeekParallelBlock>
 *   - 顶层 plan_board 从主流抽出并固定在 feed 顶部
 *   - 带 week_number/subagent_id 的标准事件不进主流,展开后由子 TimelineFeed 渲染
 *
 * 布局契约:
 *   - 父容器必须有确定高度且 flex column 上下文 (h-full + min-h-0),否则 Conversation 的 stick-to-bottom 失效
 *   - compact 模式由外层 AgentStreamCard 控制滚动高度
 */
function eventTone(item) {
    if (item.type === 'error' || item.detail?.status === 'error') return 'error';
    if (item.type === 'completed' || item.type === 'task_completed' || item.detail?.status === 'completed') return 'done';
    if (item.detail?.view_type === 'reasoning') return 'reasoning';
    if (item.detail?.view_type?.startsWith('tool_') || item.type === 'tool_call') return 'tool';
    return 'default';
}

function WorkflowEventRow({ item, compact }) {
    return (
        <motion.div
            className={cn('agui-timeline-item', compact && 'agui-timeline-item--compact')}
            initial={{ opacity: 0, y: 7, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
        >
            <span className={`agui-timeline-dot agui-timeline-dot--${eventTone(item)}`} />
            <div className="min-w-0 flex-1">
                <WidgetSwitch event={item} />
            </div>
        </motion.div>
    );
}

function WorkflowBlockRow({ children, compact }) {
    return (
        <motion.div
            className={cn('agui-timeline-item agui-timeline-item--block', compact && 'agui-timeline-item--compact')}
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
            <span className="agui-timeline-dot agui-timeline-dot--block">
                <Workflow className="size-3" />
            </span>
            <div className="min-w-0 flex-1">
                {children}
            </div>
        </motion.div>
    );
}

function eventDone(event) {
    return (
        event.type === 'completed' ||
        event.type === 'task_completed' ||
        event.type === 'week_completed' ||
        event.detail?.status === 'completed' ||
        event.detail?.status === 'output-available'
    );
}

function businessTickerLabel(event) {
    const detail = event.detail || {};
    const viewType = detail.view_type;
    const done = eventDone(event);
    const suffix = done ? '已完成' : '进行中';

    if (event.type === 'research_starting') return '正在分析宠物营养需求';
    if (event.type === 'plan_snapshot' || viewType === 'plan_board') return '任务队列已更新';
    if (event.type === 'dispatching') return '正在调度周计划 Agent';
    if (event.type === 'week_completed') return `第 ${detail.week_number || detail.week || ''} 周计划已完成`;
    if (event.type === 'completed') return '专属饮食计划已生成';
    if (event.type === 'error') return event.message || '生成遇到问题';
    if (viewType === 'subagent_dispatch') return `子 Agent ${done ? '完成任务' : '开始执行'}`;
    if (viewType === 'week_dispatch') return `第 ${detail.week_number || detail.week || ''} 周 Agent 已接收任务`;
    if (viewType === 'tool_search') return `资料检索${suffix}`;
    if (viewType === 'tool_note_read') return `读取营养资料${suffix}`;
    if (viewType === 'tool_note_write') return `整理阶段笔记${suffix}`;
    if (viewType === 'tool_food_calc') return `营养计算${suffix}`;
    if (viewType?.startsWith('tool_') || event.type === 'tool_call') return `工具调用${suffix}`;
    if (viewType === 'reasoning') return done ? '推理完成' : '正在推理方案';
    if (viewType === 'ai_message') return '生成阶段说明';
    return event.message || event.task_name || '工作流事件更新';
}

function WorkflowTicker({ events, emptyText }) {
    const tickerEvents = useMemo(
        () => events
            .filter((event) => event?._kind !== 'week_block' && event?._kind !== 'subagent_block')
            .slice(-3),
        [events],
    );

    if (tickerEvents.length === 0) {
        return (
            <div className="agui-workflow-ticker">
                <div className="agui-workflow-ticker-row">
                    <span className="agui-preview-spinner" />
                    <span>{emptyText || '正在启动详细工作流...'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="agui-workflow-ticker" aria-label="工作流进展预览">
            {tickerEvents.map((event, index) => (
                <div
                    className={cn('agui-workflow-ticker-row', index === 0 && tickerEvents.length === 3 && 'is-faded')}
                    key={eventKey(event)}
                >
                    {eventDone(event) ? (
                        <span className="agui-ticker-check" />
                    ) : (
                        <span className="agui-preview-spinner" />
                    )}
                    <span className="truncate">{businessTickerLabel(event)}</span>
                </div>
            ))}
        </div>
    );
}

export default function TimelineFeed({ events, emptyText, compact = false }) {
    const [open, setOpen] = useState(false);
    const { mainStream, weekBuckets, weekCards, subagentBuckets, subagentCards } = useMemo(
        () => organizeEventsForTimeline(events || [], { nested: compact }),
        [events, compact]
    );
    const visibleStream = useMemo(() => {
        if (compact) {
            return mainStream;
        }
        const visible = [];
        for (const item of mainStream) {
            if (item?.detail?.view_type === 'plan_board') {
                continue;
            }
            visible.push(item);
        }
        return visible;
    }, [mainStream, compact]);

    if (compact && visibleStream.length === 0) {
        return (
            <div className={compact ? 'py-4' : 'flex h-full items-center justify-center py-12'}>
                <ConversationEmptyState
                    className="text-[var(--agui-muted)]"
                    icon={<Sparkles className="size-9" />}
                    title={emptyText || '等待事件流...'}
                    description={compact ? null : '工作流事件会在这里出现'}
                />
            </div>
        );
    }

    if (!compact) {
        return (
            <section className={cn('agui-workflow-card', open && 'is-open')}>
                <button
                    aria-expanded={open}
                    className="agui-workflow-card-trigger"
                    onClick={() => setOpen((value) => !value)}
                    type="button"
                >
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Workflow className="size-4 text-[var(--agui-green-ink)]" />
                            <h3 className="truncate text-[17px] font-semibold tracking-normal">详细工作流</h3>
                        </div>
                        <p className="mt-1 truncate text-[12px] text-[var(--agui-muted)]">
                            研究、调度、生成与汇总会在这里连续推进
                        </p>
                    </div>
                    <ChevronDown className={cn('size-5 shrink-0 text-[var(--agui-muted)] transition-transform duration-200', open && 'rotate-180')} />
                </button>

                {!open && (
                    <div className="px-4 pb-4">
                        <WorkflowTicker events={visibleStream} emptyText={emptyText} />
                    </div>
                )}

                {open && (
                    <div className="agui-workflow-expanded">
                        {visibleStream.length > 0 ? (
                            <Conversation className="h-full">
                                <ConversationContent className="agui-workflow-content gap-5 px-0 py-4">
                                    <AnimatePresence initial={false}>
                                        {visibleStream.map((item) => {
                                            if (item._kind === 'week_block') {
                                                return (
                                                    <WorkflowBlockRow key="week_block" compact={compact}>
                                                        <WeekParallelBlock buckets={weekBuckets} cards={weekCards} />
                                                    </WorkflowBlockRow>
                                                );
                                            }
                                            if (item._kind === 'subagent_block') {
                                                return (
                                                    <WorkflowBlockRow key="subagent_block" compact={compact}>
                                                        <SubAgentParallelBlock cards={subagentCards} buckets={subagentBuckets} />
                                                    </WorkflowBlockRow>
                                                );
                                            }
                                            return (
                                                <WorkflowEventRow
                                                    key={eventKey(item)}
                                                    item={item}
                                                    compact={compact}
                                                />
                                            );
                                        })}
                                    </AnimatePresence>
                                </ConversationContent>
                                <ConversationScrollButton className="agui-scroll-button" />
                            </Conversation>
                        ) : (
                            <div className="flex h-full items-center justify-center py-10">
                                <ConversationEmptyState
                                    className="text-[var(--agui-muted)]"
                                    icon={<Sparkles className="size-9" />}
                                    title={emptyText || '等待事件流...'}
                                    description={null}
                                />
                            </div>
                        )}
                    </div>
                )}
            </section>
        );
    }

    return (
        <div className="min-h-0">
            {visibleStream.length > 0 && (
                <Conversation className="overflow-visible">
                    <ConversationContent
                        className="agui-workflow-content agui-workflow-content--compact gap-2 px-0 py-1"
                    >
                        <AnimatePresence initial={false}>
                            {visibleStream.map((item) => {
                                if (item._kind === 'week_block') {
                                    return (
                                        <WorkflowBlockRow
                                            key="week_block"
                                            compact={compact}
                                        >
                                            <WeekParallelBlock buckets={weekBuckets} cards={weekCards} />
                                        </WorkflowBlockRow>
                                    );
                                }
                                if (item._kind === 'subagent_block') {
                                    return (
                                        <WorkflowBlockRow
                                            key="subagent_block"
                                            compact={compact}
                                        >
                                            <SubAgentParallelBlock cards={subagentCards} buckets={subagentBuckets} />
                                        </WorkflowBlockRow>
                                    );
                                }
                                return (
                                    <WorkflowEventRow
                                        key={eventKey(item)}
                                        item={item}
                                        compact={compact}
                                    />
                                );
                            })}
                        </AnimatePresence>
                    </ConversationContent>
                    <ConversationScrollButton className="agui-scroll-button" />
                </Conversation>
            )}
        </div>
    );
}
