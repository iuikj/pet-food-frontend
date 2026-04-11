import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePhotoSelect from '../hooks/usePhotoSelect';
import SecureImage from '../components/SecureImage';
import { useUser } from '../hooks/useUser';

export default function ProfileEdit() {
    const navigate = useNavigate();
    const { user, updateUser, updateAvatar, isLoading } = useUser();
    const { selectPhoto } = usePhotoSelect();

    const [avatar, setAvatar] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [formData, setFormData] = useState({
        nickname: '',
        phone: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setAvatar(user.avatar_url || '');
            setFormData({
                nickname: user.nickname || user.username || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const handleAvatarChange = async () => {
        const result = await selectPhoto({
            width: 400,
            height: 400,
            fileName: 'avatar.jpg',
            promptLabelHeader: '选择头像来源',
            promptLabelPhoto: '从相册选择',
            promptLabelPicture: '拍照',
        });

        if (result) {
            setAvatar(result.dataUrl);
            setAvatarFile(result.file);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');

        try {
            const updateResult = await updateUser({
                nickname: formData.nickname || undefined,
                phone: formData.phone || undefined,
            });

            if (!updateResult.success) {
                setError(updateResult.message || '更新资料失败');
                return;
            }

            if (avatarFile) {
                const avatarResult = await updateAvatar(avatarFile);
                if (!avatarResult.success) {
                    setError(avatarResult.message || '资料已保存，但头像上传失败，请重试');
                    return;
                }
            }

            navigate('/profile');
        } catch (err) {
            console.error('更新资料失败:', err);
            setError('更新资料失败，请稍后重试');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
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
                <h1 className="text-xl font-bold text-center flex-1">编辑个人资料</h1>
                <div className="w-10 h-10" />
            </header>

            <main className="px-6 py-6 flex-1 overflow-y-auto">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div
                            onClick={handleAvatarChange}
                            className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent-blue p-1 shadow-glow cursor-pointer overflow-hidden"
                        >
                            {avatar ? (
                                <SecureImage
                                    src={avatar}
                                    alt="Avatar"
                                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-background-dark"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-background-dark">
                                    <span className="material-icons-round text-4xl text-gray-400">person</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                <span className="material-icons-round text-white text-3xl">camera_alt</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-3">
                        点击更换头像
                    </p>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            昵称
                        </label>
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                                person
                            </span>
                            <input
                                type="text"
                                name="nickname"
                                value={formData.nickname}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-text-main-light dark:text-text-main-dark focus:ring-0 rounded-2xl"
                                placeholder="请输入昵称"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                            邮箱 <span className="text-text-muted-light dark:text-text-muted-dark font-normal">(不可修改)</span>
                        </label>
                        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-soft">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                                email
                            </span>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-text-muted-light dark:text-text-muted-dark rounded-2xl cursor-not-allowed"
                            />
                        </div>
                    </div>

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

                {user?.is_pro && (
                    <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200/50 dark:border-yellow-900/30">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-yellow-400/30 dark:bg-yellow-900/30 flex items-center justify-center">
                                <span className="material-icons-round text-yellow-600 dark:text-yellow-400 text-2xl">star</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-yellow-800 dark:text-yellow-200">PRO 会员</h3>
                                <p className="text-sm text-yellow-700/80 dark:text-yellow-300/80">你正在使用高级会员权益。</p>
                            </div>
                        </div>
                    </div>
                )}
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
        </motion.div>
    );
}
