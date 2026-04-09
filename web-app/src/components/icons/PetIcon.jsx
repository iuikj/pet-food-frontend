import { Cat, Dog, PawPrint } from 'lucide-react';

/**
 * 统一猫/狗/爪印图标组件，替换所有 emoji。
 *
 * @param {'cat'|'dog'|'Cat'|'Dog'|string} [type] - 宠物类型
 * @param {number} [size=20] - 图标尺寸
 * @param {string} [className] - 额外 class
 */
export default function PetIcon({ type, size = 20, className = '' }) {
    const t = (type || '').toLowerCase();
    if (t === 'cat') return <Cat size={size} className={className} />;
    if (t === 'dog') return <Dog size={size} className={className} />;
    return <PawPrint size={size} className={className} />;
}
