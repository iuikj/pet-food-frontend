/**
 * createContextualHttpAgent —— 工厂返回 { agent, setForwardedProps }。
 *
 * 设计：
 *   - HttpAgent 的 `requestInit(input)` 是 SDK 序列化前的最后钩子（input → JSON.stringify），
 *     是 ag-ui-protocol 官方推荐的「向 forwardedProps 注入额外字段」hook（见 llamaindex / langroid 集成示例）。
 *   - clone 后的实例共享 prototype 上的 requestInit，所以 box 闭包对所有 clone 副本生效。
 *
 * 用法：
 *   const { agent, setForwardedProps } = createContextualHttpAgent({ url: '/agent/...' });
 *   setForwardedProps({ pet_information: {...}, user_id: '123' });
 *   // 之后 agent.run() 时 forwardedProps 会自动 merge 进入 HTTP body
 */
import { HttpAgent } from '@copilotkit/react-core/v2';

export function createContextualHttpAgent(config) {
    const box = { value: {} };

    class ContextualHttpAgent extends HttpAgent {
        requestInit(input) {
            return super.requestInit({
                ...input,
                forwardedProps: { ...(input?.forwardedProps || {}), ...box.value },
            });
        }
    }

    return {
        agent: new ContextualHttpAgent(config),
        setForwardedProps(props) {
            box.value = props && typeof props === 'object' ? props : {};
        },
        getForwardedProps() {
            return { ...box.value };
        },
    };
}
