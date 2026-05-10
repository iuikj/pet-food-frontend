import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars -- motion used via JSX
import { Check, CircleDashed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { eventDone, previewCommand } from '@/utils/eventPresentation';

/**
 * EventPreviewStack
 *
 * 事件流预览组件（最近 N 条，轻量位移动画）。
 * 当前由 FanoutCard 使用；样式 token 在 index.css 的 .agui-event-preview。
 */
export default function EventPreviewStack({ events, className }) {
    if (!events || events.length === 0) {
        return (
            <div className={cn('agui-event-preview agui-event-preview--empty', className)}>
                <div className="agui-event-preview-row">
                    <CircleDashed className="size-3.5" />
                    <span>等待事件更新...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('agui-event-preview', className)} aria-label="事件流预览">
            <AnimatePresence initial={false}>
                {events.map((event, index) => (
                    <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            'agui-event-preview-row',
                            index === 0 && events.length === 3 && 'is-faded',
                        )}
                        exit={{ opacity: 0, y: -4 }}
                        initial={{ opacity: 0, y: 4 }}
                        key={`${event.timestamp || ''}-${event.type || ''}-${event.detail?.message_id || event.detail?.call_id || index}`}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                    >
                        {eventDone(event) ? (
                            <Check className="size-3.5" />
                        ) : (
                            <span className="agui-preview-spinner" />
                        )}
                        <span className="truncate">{previewCommand(event)}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
