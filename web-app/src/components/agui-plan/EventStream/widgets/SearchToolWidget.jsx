import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import { toToolUIPart, toAiSdkSources } from '@/lib/aiElementsAdapter';

/**
 * 搜索工具 Widget — Tool 容器内嵌入 Sources 来源列表。
 * 适用于 ingredient_search / tavily_search / web_search 等返回结构化 results 的工具。
 */
export default function SearchToolWidget({ event }) {
    const part = toToolUIPart(event);
    const sources = toAiSdkSources(event);
    return (
        <Tool className="agui-tool-card">
            <ToolHeader className="agui-tool-header" type={part.type} state={part.state} />
            <ToolContent className="agui-tool-content">
                {part.input && Object.keys(part.input).length > 0 && (
                    <ToolInput className="agui-tool-io" input={part.input} />
                )}
                {sources.length > 0 ? (
                    <Sources className="agui-sources">
                        <SourcesTrigger count={sources.length} />
                        <SourcesContent>
                            {sources.map((s, i) => (
                                <Source key={`${s.url}-${i}`} href={s.url} title={s.title} />
                            ))}
                        </SourcesContent>
                    </Sources>
                ) : (
                    <ToolOutput className="agui-tool-io" output={part.output} errorText={part.errorText} />
                )}
            </ToolContent>
        </Tool>
    );
}
