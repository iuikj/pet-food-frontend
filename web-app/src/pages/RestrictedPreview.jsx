import { useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { useAuthEntry } from '../hooks/useAuthEntry';
import { pageTransitions } from '../utils/animations';

const PREVIEW_COPY = {
    calendar: {
        icon: 'calendar_today',
        title: '喂养日程会在这里展开',
        description: '登录后查看宠物的每日喂养、待办提醒和日历同步。',
        action: '登录查看日程',
        context: 'calendar',
    },
    recipes: {
        icon: 'restaurant_menu',
        title: '管理宠物的饮食计划',
        description: '登录后查看已生成的食谱、食材库和计划应用状态。',
        action: '登录管理食谱',
        context: 'recipes',
    },
    plan: {
        icon: 'auto_awesome',
        title: '创建专属营养计划',
        description: '登录后选择宠物档案，生成可追踪的饮食规划。',
        action: '登录继续制定',
        context: 'plan',
    },
    summary: {
        icon: 'menu_book',
        title: '专属计划会保存在这里',
        description: '登录后查看已生成的周计划、营养建议和餐食详情。',
        action: '登录查看计划',
        context: 'summary',
    },
    profile: {
        icon: 'person',
        title: '宠物档案与账号空间',
        description: '登录后管理账号资料、宠物档案和健康记录。',
        action: '登录管理档案',
        context: 'profile',
    },
    default: {
        icon: 'lock',
        title: '登录后继续',
        description: '这个页面需要登录后才能保存和同步你的宠物数据。',
        action: '登录继续',
        context: 'default',
    },
};

export default function RestrictedPreview({ type = 'default', autoPrompt = false, target }) {
    const { promptAuth } = useAuthEntry();
    const copy = PREVIEW_COPY[type] || PREVIEW_COPY.default;

    useEffect(() => {
        if (autoPrompt) {
            promptAuth({ target, context: copy.context });
        }
    }, [autoPrompt, copy.context, promptAuth, target]);

    return (
        <Motion.div {...pageTransitions} className="pb-32 overflow-x-clip">
            <PageHeader title="" />
            <main className="px-6 pt-8">
                <section className="rounded-[2rem] bg-white p-6 shadow-soft dark:bg-surface-dark">
                    <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <span className="material-icons-round text-4xl">{copy.icon}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
                        {copy.title}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-text-muted-light dark:text-text-muted-dark">
                        {copy.description}
                    </p>
                    <div className="mt-6 space-y-3">
                        <div className="h-20 rounded-2xl border border-dashed border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/30" />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="h-16 rounded-2xl border border-dashed border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/30" />
                            <div className="h-16 rounded-2xl border border-dashed border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/30" />
                        </div>
                    </div>
                    <Button
                        className="mt-6 h-12 w-full rounded-2xl font-bold"
                        onClick={() => promptAuth({ target, context: copy.context })}
                        type="button"
                    >
                        {copy.action}
                    </Button>
                </section>
            </main>
        </Motion.div>
    );
}
