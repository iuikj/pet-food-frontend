/**
 * 宠物相关工具函数
 */

/**
 * 将宠物年龄（月）转换为可读格式
 * @param {number} ageInMonths - 年龄（月）
 * @returns {string} 格式化的年龄字符串，如 "2岁3个月" 或 "5个月"
 */
export function formatPetAge(ageInMonths) {
    if (!ageInMonths || ageInMonths < 0) {
        return '未知';
    }

    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;

    if (years === 0) {
        return `${months}个月`;
    } else if (months === 0) {
        return `${years}岁`;
    } else {
        return `${years}岁${months}个月`;
    }
}

/**
 * 将年和月转换为总月数
 * @param {number} years - 年数
 * @param {number} months - 月数
 * @returns {number} 总月数
 */
export function toMonths(years, months) {
    return (parseInt(years) || 0) * 12 + (parseInt(months) || 0);
}

/**
 * 将总月数拆分为年和月
 * @param {number} totalMonths - 总月数
 * @returns {{ years: number, months: number }} 年和月对象
 */
export function fromMonths(totalMonths) {
    const months = totalMonths || 0;
    return {
        years: Math.floor(months / 12),
        months: months % 12
    };
}
