import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePets } from '../hooks/usePets';
import usePhotoSelect from '../hooks/usePhotoSelect';
import SecureImage from '../components/SecureImage';
import PetIcon from '../components/icons/PetIcon';
import { fromMonths, toMonths } from '../utils/petUtils';

const GENDER_OPTIONS = [
    { value: 'male', label: '♂ 公' },
    { value: 'female', label: '♀ 母' },
];

const TYPE_OPTIONS = [
    { value: 'dog', iconType: 'dog', label: '狗狗' },
    { value: 'cat', iconType: 'cat', label: '猫咪' },
];

export default function PetEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { getPetById, updatePet, deletePet, uploadPetAvatar, isLoading } = usePets();
    const { selectPhoto } = usePhotoSelect();

    const petData = getPetById(id);

    const [photo, setPhoto] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'dog',
        breed: '',
        ageYears: '',
        ageMonths: '',
        weight: '',
        gender: '',
        health_status: '',
        special_requirements: '',
    });
    const [allergens, setAllergens] = useState([]);
    const [allergenInput, setAllergenInput] = useState('');
    const [healthIssues, setHealthIssues] = useState([]);
    const [issueInput, setIssueInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (petData) {
            setPhoto(petData.avatar_url || '');
            const { years, months } = fromMonths(petData.age || 0);
            setFormData({
                name: petData.name || '',
                type: petData.type || 'dog',
                breed: petData.breed || '',
                ageYears: years > 0 ? years.toString() : '',
                ageMonths: months > 0 ? months.toString() : '',
                weight: petData.weight?.toString() || '',
                gender: petData.gender || '',
                health_status: petData.health_status || '',
                special_requirements: petData.special_requirements || '',
            });
            setAllergens(Array.isArray(petData.allergens) ? petData.allergens : []);
            setHealthIssues(Array.isArray(petData.health_issues) ? petData.health_issues : []);
        }
    }, [petData]);

    useEffect(() => {
        if (!isLoading && !petData) {
            navigate('/profile');
        }
    }, [petData, isLoading, navigate]);

    const handlePhotoChange = async () => {
        const result = await selectPhoto({
            fileName: 'pet_avatar.jpg',
            promptLabelHeader: '选择宠物头像来源',
            promptLabelPhoto: '从相册选择',
            promptLabelPicture: '拍照',
        });

        if (result) {
            setPhoto(result.dataUrl);
            setPhotoFile(result.file);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const addTag = (list, setList, value) => {
        const trimmed = value.trim();
        if (!trimmed || list.includes(trimmed)) {
            return;
        }
        setList([...list, trimmed]);
    };

    const removeTag = (list, setList, value) => {
        setList(list.filter((item) => item !== value));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('请输入宠物名称');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const ageInMonths = toMonths(formData.ageYears, formData.ageMonths);
            const parsedWeight = Number.parseFloat(formData.weight);

            const updateResult = await updatePet(id, {
                name: formData.name.trim(),
                type: formData.type || undefined,
                breed: formData.breed || undefined,
                age: ageInMonths > 0 ? ageInMonths : undefined,
                weight: Number.isFinite(parsedWeight) ? parsedWeight : undefined,
                gender: formData.gender || undefined,
                health_status: formData.health_status || undefined,
                special_requirements: formData.special_requirements || undefined,
                allergens,
                health_issues: healthIssues,
            });

            if (!updateResult.success) {
                setError(updateResult.message || '更新宠物信息失败');
                return;
            }

            if (photoFile) {
                const avatarResult = await uploadPetAvatar(id, photoFile);
                if (!avatarResult.success) {
                    setError(avatarResult.message || '宠物信息已保存，但头像上传失败，请重试');
                    return;
                }
            }

            navigate('/profile');
        } catch (err) {
            console.error('更新宠物失败:', err);
            setError('更新宠物失败，请稍后重试');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = await deletePet(id);
        if (result.success) {
            navigate('/profile');
        } else {
            setError(result.message || '删除宠物失败');
            setShowDeleteConfirm(false);
        }
    };

    if (isLoading || !petData) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center">
                <span className="material-icons-round text-4xl text-primary animate-spin">refresh</span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col min-h-[100dvh] bg-background-light dark:bg-background-dark pb-safe"
        >
            <header className="px-6 pt-12 pb-4 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
                <Link
                    to="/profile"
                    className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                >
                    <span className="material-icons-round">arrow_back</span>
                </Link>
                <h1 className="text-xl font-bold text-center flex-1">编辑宠物资料</h1>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-text-muted-light dark:text-text-muted-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    <span className="material-icons-round">delete_outline</span>
                </button>
            </header>

            <main className="px-6 py-6 flex-1 overflow-y-auto">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div
                            onClick={handlePhotoChange}
                            className="relative w-32 h-32 rounded-2xl bg-gray-100 dark:bg-surface-dark shadow-soft cursor-pointer overflow-hidden border-4 border-white dark:border-surface-light/5"
                        >
                            {photo ? (
                                <>
                                    <SecureImage
                                        src={photo}
                                        alt="Pet"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-icons-round text-white text-3xl">edit</span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <span className="material-icons-round text-4xl">add_a_photo</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-3">
                        点击更换宠物头像
                    </p>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            宠物名称 *
                        </label>
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                                pets
                            </span>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                placeholder="请输入宠物名称"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            物种
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {TYPE_OPTIONS.map(item => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, type: item.value }))}
                                    className={`py-3 rounded-2xl text-base font-bold transition-all duration-200 flex items-center justify-center gap-2 ${formData.type === item.value
                                        ? 'bg-primary text-white shadow-glow scale-[1.02]'
                                        : 'bg-white dark:bg-surface-dark text-text-main-light dark:text-text-main-dark shadow-soft hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <PetIcon type={item.iconType} size={24} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            性别（可选）
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {GENDER_OPTIONS.map(item => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        gender: prev.gender === item.value ? '' : item.value,
                                    }))}
                                    className={`py-3 rounded-2xl text-base font-bold transition-all duration-200 ${formData.gender === item.value
                                        ? 'bg-primary text-white shadow-glow scale-[1.02]'
                                        : 'bg-white dark:bg-surface-dark text-text-main-light dark:text-text-main-dark shadow-soft hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            品种
                        </label>
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                                category
                            </span>
                            <input
                                type="text"
                                name="breed"
                                value={formData.breed}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                placeholder="请输入品种"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            年龄
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                                    cake
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    name="ageYears"
                                    value={formData.ageYears}
                                    onChange={handleInputChange}
                                    className="w-full bg-transparent border-none py-4 pl-12 pr-10 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                    placeholder="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted-light dark:text-text-muted-dark">岁</span>
                            </div>
                            <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                                <input
                                    type="number"
                                    min="0"
                                    max="11"
                                    name="ageMonths"
                                    value={formData.ageMonths}
                                    onChange={handleInputChange}
                                    className="w-full bg-transparent border-none py-4 pl-5 pr-14 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                    placeholder="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted-light dark:text-text-muted-dark">个月</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            体重 (kg)
                        </label>
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                                monitor_weight
                            </span>
                            <input
                                type="number"
                                step="0.1"
                                name="weight"
                                value={formData.weight}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                placeholder="kg"
                            />
                        </div>
                        <Link
                            to={`/pet/${id}/weight`}
                            className="flex items-center justify-between bg-primary/10 dark:bg-primary/5 rounded-2xl px-4 py-3 mt-2 hover:bg-primary/20 active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                    <span className="material-icons-round text-lg">show_chart</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark">查看体重曲线</p>
                                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">查看历史记录与趋势</p>
                                </div>
                            </div>
                            <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark">chevron_right</span>
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            过敏原
                        </label>
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft">
                            <div className="flex flex-wrap gap-2 items-center min-h-[40px]">
                                {allergens.map((item) => (
                                    <span key={item} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-green-900 dark:text-green-100 text-sm font-medium">
                                        {item}
                                        <button
                                            onClick={() => removeTag(allergens, setAllergens, item)}
                                            className="ml-1 -mr-1 h-4 w-4 rounded-full flex items-center justify-center text-green-700 dark:text-green-200 hover:bg-primary/30"
                                            type="button"
                                        >
                                            <span className="material-icons-round text-xs">close</span>
                                        </button>
                                    </span>
                                ))}
                                <input
                                    className="flex-1 min-w-[120px] border-none focus:ring-0 bg-transparent text-sm text-text-main-light dark:text-text-main-dark p-0"
                                    placeholder="输入过敏原后按回车添加"
                                    type="text"
                                    value={allergenInput}
                                    onChange={(e) => setAllergenInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && allergenInput.trim()) {
                                            addTag(allergens, setAllergens, allergenInput);
                                            setAllergenInput('');
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            健康问题
                        </label>
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft">
                            <div className="flex flex-wrap gap-2 items-center min-h-[40px]">
                                {healthIssues.map((item) => (
                                    <span key={item} className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 text-sm font-medium">
                                        {item}
                                        <button
                                            onClick={() => removeTag(healthIssues, setHealthIssues, item)}
                                            className="ml-1 -mr-1 h-4 w-4 rounded-full flex items-center justify-center text-amber-700 dark:text-amber-200 hover:bg-amber-200/50"
                                            type="button"
                                        >
                                            <span className="material-icons-round text-xs">close</span>
                                        </button>
                                    </span>
                                ))}
                                <input
                                    className="flex-1 min-w-[120px] border-none focus:ring-0 bg-transparent text-sm text-text-main-light dark:text-text-main-dark p-0"
                                    placeholder="输入健康问题后按回车添加"
                                    type="text"
                                    value={issueInput}
                                    onChange={(e) => setIssueInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && issueInput.trim()) {
                                            addTag(healthIssues, setHealthIssues, issueInput);
                                            setIssueInput('');
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            健康状态（补充描述，可选）
                        </label>
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                                favorite
                            </span>
                            <input
                                type="text"
                                name="health_status"
                                value={formData.health_status}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                placeholder="例如：术后恢复中、活泼好动"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            特殊需求（可选）
                        </label>
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                            <textarea
                                name="special_requirements"
                                value={formData.special_requirements}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full bg-transparent border-none py-4 px-4 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl resize-none"
                                placeholder="例如：需要低脂饮食、挑食、偏好湿粮"
                            />
                        </div>
                    </div>
                </div>
            </main>

            <div className="px-6 py-6 bg-background-light dark:bg-background-dark border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-primary hover:bg-green-400 disabled:opacity-70 text-white font-bold text-lg py-4 rounded-2xl shadow-glow transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <span className="material-icons-round animate-spin">refresh</span>
                            保存中...
                        </>
                    ) : (
                        <>
                            <span className="material-icons-round">check</span>
                            保存修改
                        </>
                    )}
                </button>
            </div>

            <AnimatePresence>
                {showDeleteConfirm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setShowDeleteConfirm(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-surface-dark rounded-3xl shadow-large z-50 p-6"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <span className="material-icons-round text-red-500 text-3xl">delete_forever</span>
                                </div>
                                <h3 className="text-xl font-bold mb-2">确认删除宠物？</h3>
                                <p className="text-text-muted-light dark:text-text-muted-dark mb-6">
                                    删除后将无法恢复，确定要删除 {formData.name || '这只宠物'} 吗？
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
