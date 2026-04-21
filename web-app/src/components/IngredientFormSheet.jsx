import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 食材表单抽屉
 *
 * 用于创建 / 编辑自定义食材。字段按语义分组，基础信息必填，
 * 各类营养素可选且按组折叠以降低用户认知负担。
 *
 * props:
 *   isOpen       控制显隐
 *   onClose      关闭回调
 *   onSubmit     (payload) => Promise<{ success, message? }>
 *   initial      编辑模式传入现有 Ingredient；创建模式传 null/undefined
 *   categories   已知的 { category, sub_category, count }[]，用于下拉推荐
 */

// 字段分组定义：[key, 中文标签, 单位, step]
const MACRO_FIELDS = [
    ['calories', '热量', 'kcal', 0.1],
    ['protein', '蛋白质', 'g', 0.1],
    ['fat', '脂肪', 'g', 0.1],
    ['carbohydrates', '碳水', 'g', 0.1],
    ['dietary_fiber', '膳食纤维', 'g', 0.1],
    ['water', '水分', 'g', 0.1],
];

const MINERAL_FIELDS = [
    ['calcium', '钙', 'mg', 0.01],
    ['phosphorus', '磷', 'mg', 0.01],
    ['iron', '铁', 'mg', 0.01],
    ['zinc', '锌', 'mg', 0.01],
    ['sodium', '钠', 'mg', 0.01],
    ['potassium', '钾', 'mg', 0.01],
    ['magnesium', '镁', 'mg', 0.01],
    ['copper', '铜', 'mg', 0.01],
    ['manganese', '锰', 'mg', 0.01],
    ['iodine', '碘', 'μg', 0.01],
    ['selenium', '硒', 'μg', 0.01],
];

const VITAMIN_FIELDS = [
    ['vitamin_a', '维生素 A', 'IU', 0.01],
    ['vitamin_d', '维生素 D', 'IU', 0.01],
    ['vitamin_e', '维生素 E', 'mg', 0.01],
    ['vitamin_b1', '维生素 B1', 'mg', 0.01],
];

const FATTY_ACID_FIELDS = [
    ['epa', 'EPA', 'mg', 0.01],
    ['dha', 'DHA', 'mg', 0.01],
    ['epa_dha', 'EPA+DHA', 'mg', 0.01],
];

const OTHER_FIELDS = [
    ['choline', '胆碱', 'mg', 0.01],
    ['taurine', '牛磺酸', 'mg', 0.01],
    ['cholesterol', '胆固醇', 'mg', 0.01],
    ['bone_content', '骨骼含量', '%', 0.1],
];

const ALL_NUM_FIELDS = [
    ...MACRO_FIELDS,
    ...MINERAL_FIELDS,
    ...VITAMIN_FIELDS,
    ...FATTY_ACID_FIELDS,
    ...OTHER_FIELDS,
];

const EMPTY_FORM = {
    name: '',
    category: '',
    sub_category: '',
    note: '',
};

export default function IngredientFormSheet({
    isOpen,
    onClose,
    onSubmit,
    initial,
    categories = [],
}) {
    const isEdit = Boolean(initial?.id);

    const [basic, setBasic] = useState(EMPTY_FORM);
    const [nutrients, setNutrients] = useState({});
    const [openGroups, setOpenGroups] = useState({ mineral: false, vitamin: false, fatty: false, other: false });
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);

    // 打开时初始化表单
    useEffect(() => {
        if (!isOpen) return;
        if (initial) {
            setBasic({
                name: initial.name || '',
                category: initial.category || '',
                sub_category: initial.sub_category || '',
                note: initial.note || '',
            });
            const nut = {};
            for (const [key] of ALL_NUM_FIELDS) {
                nut[key] = initial[key] != null ? String(initial[key]) : '';
            }
            setNutrients(nut);
        } else {
            setBasic(EMPTY_FORM);
            const nut = {};
            for (const [key] of ALL_NUM_FIELDS) nut[key] = '';
            setNutrients(nut);
        }
        setErrorMsg('');
        setOpenGroups({ mineral: false, vitamin: false, fatty: false, other: false });
    }, [isOpen, initial]);

    const categoryOptions = useMemo(() => {
        const set = new Set();
        for (const c of categories) {
            if (c?.category) set.add(c.category);
        }
        return Array.from(set);
    }, [categories]);

    const subCategoryOptions = useMemo(() => {
        if (!basic.category) return [];
        const set = new Set();
        for (const c of categories) {
            if (c?.category === basic.category && c?.sub_category) set.add(c.sub_category);
        }
        return Array.from(set);
    }, [categories, basic.category]);

    const handleBasicChange = (key) => (e) => {
        setBasic((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleNutChange = (key) => (e) => {
        setNutrients((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleSubmit = async () => {
        const name = basic.name.trim();
        const category = basic.category.trim();
        const sub_category = basic.sub_category.trim();
        if (!name) {
            setErrorMsg('请输入食材名称');
            return;
        }
        if (!category || !sub_category) {
            setErrorMsg('请填写大类别和子类别');
            return;
        }

        // 营养字段：空字符串 → null；否则转 float 校验
        const payload = { name, category, sub_category, note: basic.note.trim() || null };
        for (const [key] of ALL_NUM_FIELDS) {
            const raw = (nutrients[key] ?? '').trim();
            if (!raw) {
                payload[key] = null;
                continue;
            }
            const num = Number(raw);
            if (!Number.isFinite(num) || num < 0) {
                setErrorMsg(`营养字段数值无效：${key}`);
                return;
            }
            payload[key] = num;
        }

        setSaving(true);
        setErrorMsg('');
        try {
            const res = await onSubmit?.(payload);
            if (res?.success) {
                onClose?.();
            } else {
                setErrorMsg(res?.message || '保存失败');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[90] flex items-end justify-center"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-t-3xl shadow-2xl flex flex-col"
                        style={{ maxHeight: '92vh' }}
                    >
                        {/* 顶部把手 */}
                        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>

                        {/* 标题 */}
                        <div className="text-center px-6 pb-3 flex-shrink-0">
                            <h3 className="text-lg font-bold">
                                {isEdit ? '编辑自定义食材' : '添加自定义食材'}
                            </h3>
                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                                所有营养数值按每 100 g 可食部分填写
                            </p>
                        </div>

                        {/* 可滚动内容 */}
                        <div
                            className="flex-1 overflow-y-auto px-6 pb-4 space-y-4 no-scrollbar"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {/* 基础信息 */}
                            <Section title="基础信息" required>
                                <TextField
                                    label="名称"
                                    value={basic.name}
                                    onChange={handleBasicChange('name')}
                                    placeholder="例如：三文鱼"
                                    required
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <TextField
                                        label="大类别"
                                        value={basic.category}
                                        onChange={handleBasicChange('category')}
                                        placeholder="例如：海鲜"
                                        required
                                        list="ingredient-cat-list"
                                    />
                                    <TextField
                                        label="子类别"
                                        value={basic.sub_category}
                                        onChange={handleBasicChange('sub_category')}
                                        placeholder="例如：鱼"
                                        required
                                        list="ingredient-subcat-list"
                                    />
                                </div>
                                <datalist id="ingredient-cat-list">
                                    {categoryOptions.map((c) => <option key={c} value={c} />)}
                                </datalist>
                                <datalist id="ingredient-subcat-list">
                                    {subCategoryOptions.map((c) => <option key={c} value={c} />)}
                                </datalist>
                                <TextField
                                    label="备注"
                                    value={basic.note}
                                    onChange={handleBasicChange('note')}
                                    placeholder="可选：计量说明等"
                                />
                            </Section>

                            {/* 宏量营养（默认展开） */}
                            <Section title="宏量营养（每 100g）">
                                <NumberGrid
                                    fields={MACRO_FIELDS}
                                    values={nutrients}
                                    onChange={handleNutChange}
                                />
                            </Section>

                            {/* 矿物质 */}
                            <CollapsibleSection
                                title="矿物质"
                                isOpen={openGroups.mineral}
                                onToggle={() => setOpenGroups((prev) => ({ ...prev, mineral: !prev.mineral }))}
                            >
                                <NumberGrid
                                    fields={MINERAL_FIELDS}
                                    values={nutrients}
                                    onChange={handleNutChange}
                                />
                            </CollapsibleSection>

                            {/* 维生素 */}
                            <CollapsibleSection
                                title="维生素"
                                isOpen={openGroups.vitamin}
                                onToggle={() => setOpenGroups((prev) => ({ ...prev, vitamin: !prev.vitamin }))}
                            >
                                <NumberGrid
                                    fields={VITAMIN_FIELDS}
                                    values={nutrients}
                                    onChange={handleNutChange}
                                />
                            </CollapsibleSection>

                            {/* 脂肪酸 */}
                            <CollapsibleSection
                                title="脂肪酸"
                                isOpen={openGroups.fatty}
                                onToggle={() => setOpenGroups((prev) => ({ ...prev, fatty: !prev.fatty }))}
                            >
                                <NumberGrid
                                    fields={FATTY_ACID_FIELDS}
                                    values={nutrients}
                                    onChange={handleNutChange}
                                />
                            </CollapsibleSection>

                            {/* 其他 */}
                            <CollapsibleSection
                                title="其他"
                                isOpen={openGroups.other}
                                onToggle={() => setOpenGroups((prev) => ({ ...prev, other: !prev.other }))}
                            >
                                <NumberGrid
                                    fields={OTHER_FIELDS}
                                    values={nutrients}
                                    onChange={handleNutChange}
                                />
                            </CollapsibleSection>

                            {errorMsg && (
                                <p className="text-xs text-red-500 text-center">{errorMsg}</p>
                            )}
                        </div>

                        {/* 底部操作条 */}
                        <div
                            className="flex gap-3 px-6 pt-3 pb-6 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 flex-shrink-0"
                            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
                        >
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 py-3 rounded-xl bg-primary text-white dark:text-gray-900 font-bold disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <span className="material-icons-round text-base animate-spin">refresh</span>
                                        保存中
                                    </>
                                ) : (
                                    isEdit ? '保存修改' : '创建食材'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ───────────────────────── 小型组件 ─────────────────────────

function Section({ title, required, children }) {
    return (
        <section>
            <h4 className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider mb-2 flex items-center gap-1">
                {title}
                {required && <span className="text-red-500">*</span>}
            </h4>
            <div className="space-y-3">
                {children}
            </div>
        </section>
    );
}

function CollapsibleSection({ title, isOpen, onToggle, children }) {
    return (
        <section className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
                <span className="text-sm font-bold text-text-main-light dark:text-text-main-dark">
                    {title}
                </span>
                <motion.span
                    className="material-icons-round text-text-muted-light dark:text-text-muted-dark"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    expand_more
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 pt-1">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

function TextField({ label, value, onChange, placeholder, required, list }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-text-muted-light dark:text-text-muted-dark mb-1">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                list={list}
                className="w-full bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
        </div>
    );
}

function NumberGrid({ fields, values, onChange }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {fields.map(([key, label, unit, step]) => (
                <div key={key}>
                    <label className="block text-xs text-text-muted-light dark:text-text-muted-dark mb-1">
                        {label}
                        {unit && <span className="ml-1">({unit})</span>}
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        step={step}
                        min="0"
                        value={values[key] ?? ''}
                        onChange={onChange(key)}
                        placeholder="—"
                        className="w-full bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            ))}
        </div>
    );
}
