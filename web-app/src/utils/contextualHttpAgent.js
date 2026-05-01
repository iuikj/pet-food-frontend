/**
 * createContextualHttpAgent —— 工厂函数返回 { agent, setForwardedProps, getForwardedProps }。
 *
 * ## 为什么不能用普通子类 + instance attribute？
 *
 * CopilotKit v2 `useAgent({ threadId })` 会调用 `agent.clone()` 创建 per-thread 实例
 * （见 `cloneForThread` in copilotkit-Bd0m5HFp.mjs:3502）。HttpAgent.clone 用
 * `Object.create(Object.getPrototypeOf(this))` 创建新实例 —— **不跑 constructor，
 * 不自动拷贝实例属性**。
 *
 * 所以 `cloned._extraForwardedProps = { ...this... }` 只是「clone 那一刻」的快照；
 * 之后 `setForwardedProps` 改的是 registry agent 的字段，clone 实例对此变更无感知。
 *
 * ## 方案：闭包 + shared box
 *
 * box 是工厂函数局部变量，被 class 方法的闭包捕获。clone 出来的实例共享同一个
 * prototype（其 run / prepareRunAgentInput 引用同一个 box），所以
 * 「set 一次，registry 和所有 clone 实例都看到最新值」。
 *
 * 用法：
 *   const { agent, setForwardedProps } = createContextualHttpAgent({ url: '...' });
 *   setForwardedProps({ pet_information: {...}, user_id: 'xxx' });
 */
import { HttpAgent } from '@copilotkit/react-core/v2';

export function createContextualHttpAgent(config) {
    const box = { value: {} };

    // 调试用计数：DEV 模式下打印每次 run 的 forwardedProps
    let runCount = 0;

    class ContextualHttpAgent extends HttpAgent {
        prepareRunAgentInput(parameters) {
            // CopilotKit 通过 runAgent → prepareRunAgentInput 路径触发；
            // 在这里把 box.value 合进 forwardedProps，prepareRunAgentInput 之后的
            // input 会进入 onInitialize / middleware / run，最终被序列化为 HTTP body。
            const merged = {
                ...(parameters?.forwardedProps || {}),
                ...box.value,
            };
            if (import.meta.env.DEV) {
                console.log(
                    '[ContextualHttpAgent.prepareRunAgentInput] threadId=%s forwardedProps=%o',
                    this.threadId,
                    merged,
                );
            }
            return super.prepareRunAgentInput({
                ...parameters,
                forwardedProps: merged,
            });
        }

        run(input) {
            // 兜底：legacy_to_be_removed_runAgentBridged 之类的路径会跳过
            // prepareRunAgentInput 直接传 input.forwardedProps，这里再合一次。
            const merged = {
                ...(input?.forwardedProps || {}),
                ...box.value,
            };
            if (import.meta.env.DEV) {
                runCount += 1;
                console.log(
                    '[ContextualHttpAgent.run #%d] threadId=%s url=%s forwardedProps=%o',
                    runCount,
                    this.threadId,
                    this.url,
                    merged,
                );
            }
            return super.run({ ...input, forwardedProps: merged });
        }
    }

    const agent = new ContextualHttpAgent(config);

    return {
        agent,
        setForwardedProps(props) {
            box.value = props && typeof props === 'object' ? props : {};
            if (import.meta.env.DEV) {
                console.log('[ContextualHttpAgent.setForwardedProps]', box.value);
            }
        },
        getForwardedProps() {
            return { ...box.value };
        },
    };
}
