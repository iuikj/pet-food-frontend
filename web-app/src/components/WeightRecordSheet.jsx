import { useEffect, useState } from 'react';
import WeightScale from './ui/WeightScale';
import { Button } from './ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerPanel,
    DrawerPopup,
    DrawerTitle,
} from './ui/drawer';
import { Field, FieldError, FieldLabel } from './ui/field';
import { DatePicker } from './ui/date-picker';
import { Textarea } from './ui/textarea';
import { registerBackButtonHandler } from '../hooks/useBackButton';

/**
 * YYYY-MM-DD → 本地日期字符串
 */
function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 底部抽屉：体重记录表单
 *
 * props:
 *   isOpen       控制显隐
 *   onClose      关闭回调
 *   onSubmit     ({ weight, recorded_date, notes }) => Promise<{ success, message? }>
 *   petName      展示用宠物名
 *   defaultWeight 初始体重（来自最新记录或 Pet.weight）
 */
export default function WeightRecordSheet({
    isOpen,
    onClose,
    onSubmit,
    petName,
    defaultWeight = 0,
}) {
    const [weight, setWeight] = useState(Number(defaultWeight) || 0);
    const [recordedDate, setRecordedDate] = useState(todayStr());
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setWeight(Number(defaultWeight) || 0);
            setRecordedDate(todayStr());
            setNotes('');
            setErrorMsg('');
        }
    }, [isOpen, defaultWeight]);

    useEffect(() => {
        if (!isOpen) return undefined;
        return registerBackButtonHandler(() => {
            if (saving) return true;
            onClose?.();
            return true;
        });
    }, [isOpen, onClose, saving]);

    const handleOpenChange = (open) => {
        if (!open && !saving) {
            onClose?.();
        }
    };

    const handleSave = async (event) => {
        event.preventDefault();
        if (!weight || weight <= 0) {
            setErrorMsg('请输入有效体重');
            return;
        }

        setSaving(true);
        setErrorMsg('');
        try {
            const res = await onSubmit?.({
                weight,
                recorded_date: recordedDate,
                notes: notes.trim(),
            });
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
        <Drawer open={isOpen} onOpenChange={handleOpenChange} position="bottom">
            <DrawerPopup className="mx-auto max-w-md bg-white dark:bg-surface-dark" showBar>
                <DrawerHeader className="items-center text-center">
                    <DrawerTitle className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                        记录体重
                    </DrawerTitle>
                    {petName && (
                        <DrawerDescription className="text-xs text-text-muted-light dark:text-text-muted-dark">
                            为 {petName} 记录体重变化
                        </DrawerDescription>
                    )}
                </DrawerHeader>

                <form onSubmit={handleSave} className="contents" noValidate>
                    <DrawerPanel className="space-y-5 px-6 pb-1 pt-1" scrollable={false}>
                        <Field>
                            <FieldLabel className="text-xs font-bold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
                                当前体重
                            </FieldLabel>
                            <WeightScale value={weight} onChange={setWeight} min={0.1} max={100} />
                            {errorMsg && (
                                <FieldError match className="text-center text-xs text-red-500">
                                    {errorMsg}
                                </FieldError>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-bold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
                                记录日期
                            </FieldLabel>
                            <DatePicker
                                value={recordedDate}
                                max={todayStr()}
                                onChange={(event) => setRecordedDate(event.target.value)}
                                className="rounded-xl bg-gray-50 dark:bg-gray-800"
                                aria-label="记录日期"
                            />
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-bold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
                                备注（可选）
                            </FieldLabel>
                            <Textarea
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                placeholder="例如：饭后称、身体不适"
                                rows={2}
                                maxLength={200}
                                className="rounded-xl bg-gray-50 dark:bg-gray-800"
                                aria-label="备注"
                            />
                        </Field>
                    </DrawerPanel>

                    <DrawerFooter className="grid grid-cols-2 gap-3 border-0 bg-transparent px-6 pt-2">
                        <DrawerClose
                            render={<Button variant="secondary" />}
                            disabled={saving}
                            className="h-12 rounded-xl font-bold"
                        >
                            取消
                        </DrawerClose>
                        <Button
                            type="submit"
                            loading={saving}
                            disabled={saving || !weight || weight <= 0}
                            className="h-12 rounded-xl bg-primary text-white hover:bg-primary/90 dark:text-gray-900"
                        >
                            保存
                        </Button>
                    </DrawerFooter>
                </form>
            </DrawerPopup>
        </Drawer>
    );
}
