// 统一的页面过渡动画配置
export const pageTransitions = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeInOut" }
};

// 滑动过渡动画 (用于水平导航)
export const slideTransitions = (direction = 'left') => ({
    initial: { opacity: 0, x: direction === 'left' ? 100 : -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction === 'left' ? -100 : 100 },
    transition: { duration: 0.3, ease: "easeInOut" }
});

// 淡入淡出动画 (默认)
export const fadeTransitions = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
};

// 从下往上的滑入动画
export const slideUpTransitions = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
};

// 3D 翻页动画 (用于 Loading 页步骤切换)
export const flipTransitions = (direction = 1) => ({
    initial: {
        rotateY: direction > 0 ? 90 : -90,
        opacity: 0,
        scale: 0.95,
    },
    animate: {
        rotateY: 0,
        opacity: 1,
        scale: 1,
        transition: {
            rotateY: { type: 'spring', stiffness: 200, damping: 30 },
            opacity: { duration: 0.3 },
            scale: { duration: 0.3 },
        },
    },
    exit: {
        rotateY: direction > 0 ? -90 : 90,
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.3,
            ease: 'easeInOut',
        },
    },
});
