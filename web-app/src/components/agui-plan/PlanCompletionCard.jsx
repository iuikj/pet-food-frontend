import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { savePendingSave } from '../../utils/storage';

export default function PlanCompletionCard({ detail, threadId, petName }) {
    const navigate = useNavigate();

    const plans = detail?.plans || [];
    const weekCount = plans.length;
    const firstWeek = plans[0];
    const dailyMeals = firstWeek?.weekly_diet_plan?.daily_diet_plans || [];
    const mealCount = dailyMeals.length;

    let dailyKcal = 0;
    for (const meal of dailyMeals) {
        for (const item of meal?.food_items || []) {
            const macro = item?.macro_nutrients || {};
            const p = Number(macro.protein) || 0;
            const f = Number(macro.fat) || 0;
            const c = Number(macro.carbohydrates) || 0;
            dailyKcal += p * 4 + f * 9 + c * 4;
        }
    }
    dailyKcal = Math.round(dailyKcal);

    const planId = detail?.plan_id || threadId;

    const handleClick = () => {
        if (!planId) return;
        savePendingSave({ planId, mode: 'agui' });
        sessionStorage.removeItem('pending_agui_plan_payload');
        navigate('/plan/summary', { replace: true });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.2 }}
            onClick={handleClick}
            className="mx-auto mt-4 w-full max-w-sm cursor-pointer rounded-2xl border border-green-200 dark:border-green-800 bg-green-50/80 dark:bg-green-900/20 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-800/40">
                    <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                        专属计划已生成
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {petName ? `${petName}的月度饮食方案` : '月度饮食方案'}
                    </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-gray-400" />
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                {weekCount > 0 && (
                    <span className="flex items-center gap-1">
                        <span className="material-icons-round text-sm text-green-500">calendar_month</span>
                        {weekCount} 周
                    </span>
                )}
                {dailyKcal > 0 && (
                    <span className="flex items-center gap-1">
                        <span className="material-icons-round text-sm text-yellow-500">local_fire_department</span>
                        {dailyKcal} kcal/日
                    </span>
                )}
                {mealCount > 0 && (
                    <span className="flex items-center gap-1">
                        <span className="material-icons-round text-sm text-blue-500">restaurant</span>
                        {mealCount} 餐/日
                    </span>
                )}
            </div>
        </motion.div>
    );
}
