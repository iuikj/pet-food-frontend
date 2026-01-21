import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export default function ProfileEdit() {
    const navigate = useNavigate();
    const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80');
    const [formData, setFormData] = useState({
        name: 'Alex Chen',
        email: 'alex.chen@example.com',
        phone: ''
    });
    const [saving, setSaving] = useState(false);

    const handleAvatarChange = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Prompt,
                width: 400,
                height: 400,
                saveToGallery: false,
                promptLabelHeader: '选择头像',
                promptLabelPhoto: '从相册选择',
                promptLabelPicture: '拍照'
            });
            setAvatar(image.dataUrl);
        } catch (error) {
            console.error('选择头像失败:', error);
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
                <h1 className="text-xl font-bold text-center flex-1">编辑资料</h1>
                <div className="w-10 h-10" />
            </header>

            {/* 主要内容 */}
            <main className="px-6 py-6 flex-1 overflow-y-auto">
                {/* 头像编辑 */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div
                            onClick={handleAvatarChange}
                            className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent-blue p-1 shadow-glow cursor-pointer overflow-hidden"
                        >
                            <img
                                src={avatar}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-background-dark"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                <span className="material-icons-round text-white text-3xl">camera_alt</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-3">
                        点击更换头像
                    </p>
                </div>

                {/* 表单 */}
                <div className="space-y-5">
                    {/* 姓名 */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            姓名
                        </label>
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                                person
                            </span>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                placeholder="请输入姓名"
                            />
                        </div>
                    </div>

                    {/* 邮箱 */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            邮箱
                        </label>
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                                email
                            </span>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                placeholder="请输入邮箱"
                            />
                        </div>
                    </div>

                    {/* 手机号 */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            手机号 <span className="text-text-muted-light dark:text-text-muted-dark font-normal">(可选)</span>
                        </label>
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                                phone
                            </span>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                placeholder="请输入手机号"
                            />
                        </div>
                    </div>
                </div>

                {/* 会员信息卡片 */}
                <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200/50 dark:border-yellow-900/30">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-yellow-400/30 dark:bg-yellow-900/30 flex items-center justify-center">
                            <span className="material-icons-round text-yellow-600 dark:text-yellow-400 text-2xl">star</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-yellow-800 dark:text-yellow-200">PRO 会员</h3>
                            <p className="text-sm text-yellow-700/80 dark:text-yellow-300/80">享受所有高级功能</p>
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
        </motion.div>
    );
}
