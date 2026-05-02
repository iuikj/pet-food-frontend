import { createElement } from 'react';
import { getWidget, isKnownViewType } from './widgetRegistry';
import PhaseMarkerWidget from './widgets/PhaseMarkerWidget';

/**
 * 按 detail.view_type 路由到具体 Widget。
 *
 * 优先级:
 *   1. detail.view_type 指定的 Widget
 *   2. 没 view_type 但是已知元事件 (如 dispatching / week_completed) → PhaseMarkerWidget
 *   3. 都没有 → null (不渲染)
 *
 * 使用 createElement 而不是 JSX 创建动态组件,绕开 react-hooks/static-components 规则。
 */
export default function WidgetSwitch({ event }) {
    const viewType = event.detail?.view_type;
    const Widget = getWidget(viewType);

    if (Widget) {
        return createElement(Widget, { event });
    }

    if (event.message && (event.progress !== undefined || event.type)) {
        return <PhaseMarkerWidget event={event} />;
    }

    if (import.meta.env.DEV && viewType && !isKnownViewType(viewType)) {
        console.warn('[WidgetSwitch] unknown view_type:', viewType, event);
    }

    return null;
}
