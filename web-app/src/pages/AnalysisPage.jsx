import React from 'react';
import { motion } from 'framer-motion';
import { pageTransitions } from '../utils/animations';
import { Link } from 'react-router-dom';
import ComingSoon from '../components/ComingSoon';
import { Toast } from '@capacitor/toast';

export default function AnalysisPage() {
    const handleNotifyToggle = async (enabled) => {
        await Toast.show({
            text: enabled ? '已开启功能上线通知' : '已关闭通知',
            duration: 'short',
            position: 'bottom'
        });
    };

    return (
        <motion.div
            {...pageTransitions}
            className="min-h-screen flex flex-col items-center justify-center px-6 pb-32"
        >
            <ComingSoon
                title="数据分析"
                description="智能分析宠物饮食数据，为你提供科学喂养建议"
                icon="analytics"
                accentColor="blue"
                features={[
                    { icon: 'show_chart', text: '营养摄入趋势分析' },
                    { icon: 'monitor_weight', text: '体重变化跟踪' },
                    { icon: 'favorite', text: '健康指标监测' },
                    { icon: 'overview', text: '全面健康报告' }
                ]}
                onNotifyToggle={handleNotifyToggle}
            />

            {/* 返回按钮 */}
            <Link
                to="/"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-background-light dark:bg-background-dark rounded-xl text-text-main-light dark:text-text-main-dark font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
                <span className="material-icons-round text-sm">arrow_back</span>
                返回首页
            </Link>
        </motion.div>
    );
}

