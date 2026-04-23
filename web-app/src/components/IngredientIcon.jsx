import React from 'react';
import { parseIconKey, resolveIconKey } from '../utils/ingredientIcons';
import SecureImage from './SecureImage';

/**
 * 食材图标 —— 统一入口
 *
 * 回落链：
 *   image_url              → <SecureImage>
 *   icon_key (parseable)   → emoji 或 material-icons-round
 *   名称 / 分类关键字推断   → emoji:xxx
 *   最终兜底               → 🥘
 *
 * 使用：
 *   <IngredientIcon ingredient={ing} />              // 传完整对象
 *   <IngredientIcon name="三文鱼" size={32} />       // 只有名称
 *   <IngredientIcon iconKey="emoji:fish" />          // 显式指定
 *
 * @param {object} props
 * @param {object} [props.ingredient]       完整 ingredient，优先读其 image_url / icon_key
 * @param {string} [props.iconKey]          显式 icon_key，优先级高于 ingredient.icon_key
 * @param {string} [props.name]             食材名称（兜底推断用）
 * @param {string} [props.category]
 * @param {string} [props.subCategory]
 * @param {number} [props.size=40]          整体尺寸 (px)
 * @param {string} [props.className]        外层容器额外 class
 * @param {string} [props.bgClassName]      容器底色类（例如 'bg-primary/10'）
 */
export default function IngredientIcon({
    ingredient,
    iconKey,
    name,
    category,
    subCategory,
    size = 40,
    className = '',
    bgClassName = 'bg-gray-100 dark:bg-gray-800',
}) {
    // 1. 图片优先
    const imageUrl = ingredient?.image_url;
    if (imageUrl) {
        return (
            <div
                className={`relative overflow-hidden rounded-xl ${bgClassName} ${className}`}
                style={{ width: size, height: size }}
            >
                <SecureImage
                    src={imageUrl}
                    alt={ingredient?.name || name || ''}
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    // 2. icon_key（显式 > ingredient 字段 > 推断兜底）
    const resolved = resolveIconKey({
        icon_key: iconKey ?? ingredient?.icon_key,
        name: name ?? ingredient?.name,
        category: category ?? ingredient?.category,
        sub_category: subCategory ?? ingredient?.sub_category,
    });
    const parsed = parseIconKey(resolved);

    // 字号跟随容器尺寸
    const inner = Math.max(14, Math.floor(size * 0.55));

    return (
        <div
            className={`rounded-xl flex items-center justify-center ${bgClassName} ${className}`}
            style={{ width: size, height: size }}
        >
            {parsed?.type === 'emoji' ? (
                <span style={{ fontSize: inner, lineHeight: 1 }}>{parsed.value}</span>
            ) : parsed?.type === 'mi' ? (
                <span
                    className="material-icons-round text-text-main-light dark:text-text-main-dark"
                    style={{ fontSize: inner }}
                >
                    {parsed.value}
                </span>
            ) : (
                <span style={{ fontSize: inner, lineHeight: 1 }}>🥘</span>
            )}
        </div>
    );
}
