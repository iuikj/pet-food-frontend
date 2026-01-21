import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// 示例宠物数据（后续可从状态管理获取）
const demoPets = {
    '1': {
        id: 1,
        name: 'Cooper',
        type: '金毛寻回犬',
        age: 3,
        weight: 32,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn9rRCCpDfMxR_3IoYBOVyNDNZADIHVHTErFZ1ecKqEnKJ0vl_NEf61nPEpN-muNBhi2X3_9QzQm9O2BOI0Y1XcNXFmw72fBSTG5SIfIRxxxsBrWfLqP0YcYbeXzX9-qStq9BpTXHo0YiOnjUMUtKIpl9qUKV7iaxqxdvMpKRAPntZHVH9ENBDRsvfy-7C6jtmoW-Bz_KrmfVcUz-PXlzyevQ_NUwkL4V6-3bbHLr_u_PgwcMgcMVavQRtmvGPSH9JDvWb6IV8viw'
    },
    '2': {
        id: 2,
        name: 'Luna',
        type: '英国短毛猫',
        age: 2,
        weight: 4.2,
        avatar: null
    }
};

export default function PetEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const petData = demoPets[id] || demoPets['1'];

    const [photo, setPhoto] = useState(petData.avatar);
    const [formData, setFormData] = useState({
        name: petData.name,
        type: petData.type,
        age: petData.age.toString(),
        weight: petData.weight.toString()
    });
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handlePhotoChange = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Prompt,
                width: 500,
                height: 500,
                saveToGallery: false,
                promptLabelHeader: '选择宠物照片',
                promptLabelPhoto: '从相册选择',
                promptLabelPicture: '拍照'
            });
            setPhoto(image.dataUrl);
        } catch (error) {
            console.error('选择照片失败:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        // 模拟保存
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        navigate('/profile');
    };

    const handleDelete = async () => {
        // 模拟删除
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate('/profile');
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-safe"
        >
            {/* 头部导航 */}
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

            {/* 主要内容 */}
            <main className="px-6 py-6 flex-1 overflow-y-auto">
                {/* 照片编辑 */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div
                            onClick={handlePhotoChange}
                            className="relative w-32 h-32 rounded-2xl bg-gray-100 dark:bg-surface-dark shadow-soft cursor-pointer overflow-hidden border-4 border-white dark:border-surface-light/5"
                        >
                            {photo ? (
                                <>
                                    <img
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
                        点击更换照片
                    </p>
                </div>

                {/* 表单 */}
                <div className="space-y-5">
                    {/* 名字 */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            宠物名字
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
                                placeholder="请输入宠物名字"
                            />
                        </div>
                    </div>

                    {/* 品种 */}
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
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                placeholder="请输入宠物品种"
                            />
                        </div>
                    </div>

                    {/* 年龄和体重 */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* 年龄 */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                                年龄
                            </label>
                            <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                                    cake
                                </span>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                    placeholder="岁"
                                />
                            </div>
                        </div>

                        {/* 体重 */}
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
                        </div>
                    </div>
                </div>
            </main>

            {/* 底部按钮 */}
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
                            保存更改
                        </>
                    )}
                </button>
            </div>

            {/* 删除确认弹窗 */}
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
                                <h3 className="text-xl font-bold mb-2">确定删除？</h3>
                                <p className="text-text-muted-light dark:text-text-muted-dark mb-6">
                                    删除后将无法恢复 {formData.name} 的所有数据
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
