import React, { useEffect, useMemo, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import IngredientIcon from './IngredientIcon';
import { Button } from './ui/button';
import {
    Drawer,
    DrawerFooter,
    DrawerHeader,
    DrawerPanel,
    DrawerPopup,
    DrawerTitle,
} from './ui/drawer';
import { Field, FieldError, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import {
    Select,
    SelectItem,
    SelectPopup,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import {
    EMOJI_MAP,
    listEmojiKeys,
    listMaterialIconKeys,
} from '../utils/ingredientIcons';
import { registerBackButtonHandler } from '../hooks/useBackButton';
import { showToast } from '../utils/toast';

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
    icon_key: '',
};

function uniqueNonEmpty(values) {
    const set = new Set();
    for (const value of values) {
        const nextValue = String(value || '').trim();
        if (nextValue) set.add(nextValue);
    }
    return Array.from(set);
}

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
                icon_key: initial.icon_key || '',
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

    useEffect(() => {
        if (!isOpen) return undefined;
        return registerBackButtonHandler(() => {
            if (saving) return true;
            onClose?.();
            return true;
        });
    }, [isOpen, onClose, saving]);

    const categoryOptions = useMemo(
        () => uniqueNonEmpty(categories.map((c) => c?.category)),
        [categories],
    );

    const subCategoryOptions = useMemo(() => {
        if (!basic.category) return [];
        return uniqueNonEmpty(
            categories
                .filter((c) => c?.category === basic.category)
                .map((c) => c?.sub_category),
        );
    }, [categories, basic.category]);

    const hasCategoryOptions = categoryOptions.length > 0;
    const hasSubCategoryOptions = subCategoryOptions.length > 0;
    const categoryIsStale = Boolean(basic.category) && !categoryOptions.includes(basic.category);
    const subCategoryIsStale = Boolean(basic.sub_category) && !subCategoryOptions.includes(basic.sub_category);

    const categorySelectItems = useMemo(() => {
        const items = categoryOptions.map((value) => ({ value, label: value, stale: false }));
        if (categoryIsStale) {
            items.unshift({
                value: basic.category,
                label: `${basic.category}（已不可用）`,
                stale: true,
            });
        }
        return items;
    }, [basic.category, categoryIsStale, categoryOptions]);

    const subCategorySelectItems = useMemo(() => {
        const items = subCategoryOptions.map((value) => ({ value, label: value, stale: false }));
        if (subCategoryIsStale) {
            items.unshift({
                value: basic.sub_category,
                label: `${basic.sub_category}（已不可用）`,
                stale: true,
            });
        }
        return items;
    }, [basic.sub_category, subCategoryIsStale, subCategoryOptions]);

    const handleBasicChange = (key) => (e) => {
        setBasic((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleCategoryChange = (value) => {
        setBasic((prev) => ({
            ...prev,
            category: value || '',
            sub_category: '',
        }));
    };

    const handleSubCategoryChange = (value) => {
        setBasic((prev) => ({ ...prev, sub_category: value || '' }));
    };

    const handleNutChange = (key) => (e) => {
        setNutrients((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const setError = async (message) => {
        setErrorMsg(message);
        try {
            await showToast.error(message);
        } catch {
            // Toast failure should never block form validation feedback.
        }
    };

    const handleSubmit = async () => {
        const name = basic.name.trim();
        const category = basic.category.trim();
        const sub_category = basic.sub_category.trim();
        if (!name) {
            await setError('请输入食材名称');
            return;
        }
        if (!hasCategoryOptions) {
            await setError('分类数据不可用，请稍后重试');
            return;
        }
        if (!category) {
            await setError('请选择大类别');
            return;
        }
        if (categoryIsStale) {
            await setError('当前大类别已不可用，请重新选择');
            return;
        }
        if (!hasSubCategoryOptions) {
            await setError('当前大类别暂无可用子类别');
            return;
        }
        if (!sub_category) {
            await setError('请选择子类别');
            return;
        }
        if (subCategoryIsStale) {
            await setError('当前子类别已不可用，请重新选择');
            return;
        }

        // 营养字段：空字符串 → null；否则转 float 校验
        const payload = {
            name,
            category,
            sub_category,
            note: basic.note.trim() || null,
            icon_key: basic.icon_key ? basic.icon_key.trim() : null,
        };
        for (const [key] of ALL_NUM_FIELDS) {
            const raw = (nutrients[key] ?? '').trim();
            if (!raw) {
                payload[key] = null;
                continue;
            }
            const num = Number(raw);
            if (!Number.isFinite(num) || num < 0) {
                await setError(`营养字段数值无效：${key}`);
                return;
            }
            payload[key] = num;
        }

        setSaving(true);
        setErrorMsg('');
        try {
            const res = await onSubmit?.(payload);
            if (res?.success) {
                try {
                    await showToast.success(isEdit ? '食材已更新' : '食材已创建');
                } catch {
                    // Inline state and closing behavior are enough if toast is unavailable.
                }
                onClose?.();
            } else {
                await setError(res?.message || '保存失败');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && !saving && onClose?.()} position="bottom">
            <DrawerPopup
                className="mx-auto max-w-md bg-white dark:bg-surface-dark [--drawer-height:min(92vh,820px)]"
                showBar
            >
                <DrawerHeader className="items-center px-6 pb-3 pt-5 text-center">
                    <DrawerTitle className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                        {isEdit ? '编辑自定义食材' : '添加自定义食材'}
                    </DrawerTitle>
                    <p className="mt-0.5 text-xs text-text-muted-light dark:text-text-muted-dark">
                        所有营养数值按每 100 g 可食部分填写
                    </p>
                </DrawerHeader>

                <DrawerPanel className="space-y-4 px-6 pb-4 pt-1" scrollFade={false}>
                            {/* 图标选择 */}
                            <Section title="图标">
                                <IconPicker
                                    value={basic.icon_key}
                                    onChange={(k) => setBasic((prev) => ({ ...prev, icon_key: k }))}
                                    previewIngredient={{
                                        ...(initial || {}),
                                        name: basic.name,
                                        category: basic.category,
                                        sub_category: basic.sub_category,
                                        icon_key: basic.icon_key,
                                    }}
                                />
                            </Section>

                            {/* 基础信息 */}
                            <Section title="基础信息" required>
                                <TextField
                                    name="ingredient-name"
                                    label="名称"
                                    value={basic.name}
                                    onChange={handleBasicChange('name')}
                                    placeholder="例如：三文鱼"
                                    required
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <SelectField
                                        label="大类别"
                                        value={basic.category}
                                        items={categorySelectItems}
                                        onValueChange={handleCategoryChange}
                                        placeholder={hasCategoryOptions ? '选择大类' : '暂无分类'}
                                        disabled={!hasCategoryOptions || saving}
                                        invalid={categoryIsStale || (!hasCategoryOptions && !saving)}
                                        error={
                                            !hasCategoryOptions
                                                ? '分类不可用'
                                                : categoryIsStale
                                                    ? '已不可用'
                                                    : ''
                                        }
                                        required
                                    />
                                    <SelectField
                                        label="子类别"
                                        value={basic.sub_category}
                                        items={subCategorySelectItems}
                                        onValueChange={handleSubCategoryChange}
                                        placeholder={
                                            basic.category
                                                ? hasSubCategoryOptions || subCategoryIsStale
                                                    ? '选择子类'
                                                    : '暂无子类'
                                                : '先选大类'
                                        }
                                        disabled={!basic.category || categoryIsStale || !hasSubCategoryOptions || saving}
                                        invalid={subCategoryIsStale || (Boolean(basic.category) && !hasSubCategoryOptions)}
                                        error={
                                            !basic.category
                                                ? ''
                                                : subCategoryIsStale
                                                    ? '已不可用'
                                                    : !hasSubCategoryOptions
                                                        ? '无可用子类'
                                                        : ''
                                        }
                                        required
                                    />
                                </div>
                                <TextareaField
                                    name="ingredient-note"
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
                </DrawerPanel>

                <DrawerFooter className="grid grid-cols-2 gap-3 border-t border-gray-100 bg-white px-6 pt-3 dark:border-gray-800 dark:bg-surface-dark">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={saving}
                        className="h-12 rounded-xl font-bold"
                    >
                        取消
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        loading={saving}
                        disabled={saving}
                        className="h-12 rounded-xl bg-primary font-bold text-white dark:text-gray-900"
                    >
                        {isEdit ? '保存修改' : '创建食材'}
                    </Button>
                </DrawerFooter>
            </DrawerPopup>
        </Drawer>
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
                <Motion.span
                    className="material-icons-round text-text-muted-light dark:text-text-muted-dark"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    expand_more
                </Motion.span>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <Motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 pt-1">{children}</div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

function TextField({ label, value, onChange, placeholder, required, name }) {
    return (
        <Field name={name} className="gap-1">
            <FieldLabel className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </FieldLabel>
            <Input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="rounded-xl bg-gray-50 dark:bg-gray-800"
            />
        </Field>
    );
}

function TextareaField({ label, value, onChange, placeholder, name }) {
    return (
        <Field name={name} className="gap-1">
            <FieldLabel className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark">
                {label}
            </FieldLabel>
            <Textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={2}
                maxLength={200}
                className="rounded-xl bg-gray-50 dark:bg-gray-800"
            />
        </Field>
    );
}

function SelectField({
    label,
    value,
    items,
    onValueChange,
    placeholder,
    disabled,
    invalid,
    error,
    required,
}) {
    return (
        <Field className="gap-1" disabled={disabled}>
            <FieldLabel className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </FieldLabel>
            <Select
                items={items.map((item) => ({ label: item.label, value: item.value }))}
                value={value || null}
                onValueChange={onValueChange}
            >
                <SelectTrigger
                    aria-invalid={invalid || undefined}
                    disabled={disabled}
                    className="min-w-0 rounded-xl bg-gray-50 dark:bg-gray-800"
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectPopup alignItemWithTrigger={false} className="max-h-64">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <SelectItem
                                key={item.value}
                                value={item.value}
                                disabled={item.stale}
                                className={item.stale ? 'text-red-500' : undefined}
                            >
                                {item.label}
                            </SelectItem>
                        ))
                    ) : (
                        <div className="px-2 py-2 text-sm text-muted-foreground">
                            暂无可选项
                        </div>
                    )}
                </SelectPopup>
            </Select>
            {error && (
                <FieldError match className="text-xs text-red-500">
                    {error}
                </FieldError>
            )}
        </Field>
    );
}

function NumberGrid({ fields, values, onChange }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {fields.map(([key, label, unit, step]) => (
                <Field key={key} className="items-stretch gap-1">
                    <FieldLabel className="block text-xs text-text-muted-light dark:text-text-muted-dark">
                        {label}
                        {unit && <span className="ml-1">({unit})</span>}
                    </FieldLabel>
                    <Input
                        aria-label={label}
                        className="rounded-lg bg-gray-50 text-text-main-light dark:bg-gray-800 dark:text-text-main-dark focus-within:ring-2 focus-within:ring-primary/50 [&_[data-slot=input]]:h-auto [&_[data-slot=input]]:px-3 [&_[data-slot=input]]:py-2 [&_[data-slot=input]]:text-sm [&_[data-slot=input]]:focus:ring-0"
                        nativeInput
                        unstyled
                        type="number"
                        inputMode="decimal"
                        step={step}
                        min="0"
                        value={values[key] ?? ''}
                        onChange={onChange(key)}
                        placeholder="—"
                    />
                </Field>
            ))}
        </div>
    );
}

// ─────────────────────── Icon Picker ───────────────────────

function IconPicker({ value, onChange, previewIngredient }) {
    const [tab, setTab] = useState('emoji'); // emoji | mi

    const emojiKeys = useMemo(() => listEmojiKeys(), []);
    const miKeys = useMemo(() => listMaterialIconKeys(), []);

    const isSelected = (libName, key) => value === `${libName}:${key}`;

    return (
        <div className="space-y-3">
            {/* 当前预览 + 清除按钮 */}
            <div className="flex items-center gap-3">
                <IngredientIcon
                    ingredient={previewIngredient}
                    size={56}
                    bgClassName="bg-primary/10 dark:bg-primary/15"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-main-light dark:text-text-main-dark">
                        当前图标
                    </p>
                    <p className="text-[11px] text-text-muted-light dark:text-text-muted-dark truncate">
                        {value || '未设置（按名称/分类自动推断）'}
                    </p>
                </div>
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="text-xs text-red-500 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        清除
                    </button>
                )}
            </div>

            {/* 库切换 tab */}
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl">
                <button
                    type="button"
                    onClick={() => setTab('emoji')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        tab === 'emoji'
                            ? 'bg-white dark:bg-surface-dark text-primary shadow-sm'
                            : 'text-text-muted-light dark:text-text-muted-dark'
                    }`}
                >
                    Emoji ({emojiKeys.length})
                </button>
                <button
                    type="button"
                    onClick={() => setTab('mi')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        tab === 'mi'
                            ? 'bg-white dark:bg-surface-dark text-primary shadow-sm'
                            : 'text-text-muted-light dark:text-text-muted-dark'
                    }`}
                >
                    Icons ({miKeys.length})
                </button>
            </div>

            {/* 候选 grid */}
            <div
                className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                style={{ overscrollBehavior: 'contain' }}
            >
                {tab === 'emoji'
                    ? emojiKeys.map((k) => (
                        <button
                            key={k}
                            type="button"
                            title={k}
                            onClick={() => onChange(`emoji:${k}`)}
                            className={`aspect-square rounded-lg flex items-center justify-center text-xl transition-all active:scale-95 ${
                                isSelected('emoji', k)
                                    ? 'bg-primary/20 ring-2 ring-primary'
                                    : 'bg-white dark:bg-surface-dark hover:bg-primary/10'
                            }`}
                        >
                            {EMOJI_MAP[k]}
                        </button>
                    ))
                    : miKeys.map((k) => (
                        <button
                            key={k}
                            type="button"
                            title={k}
                            onClick={() => onChange(`mi:${k}`)}
                            className={`aspect-square rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                                isSelected('mi', k)
                                    ? 'bg-primary/20 ring-2 ring-primary text-primary'
                                    : 'bg-white dark:bg-surface-dark hover:bg-primary/10 text-text-main-light dark:text-text-main-dark'
                            }`}
                        >
                            <span className="material-icons-round text-xl">{k}</span>
                        </button>
                    ))}
            </div>
        </div>
    );
}
