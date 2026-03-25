import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import usePhotoSelect from '../hooks/usePhotoSelect';
import OnboardingLayout from '../components/OnboardingLayout';

export default function OnboardingName() {
    const navigate = useNavigate();
    const location = useLocation();
    const [petPhoto, setPetPhoto] = useState(sessionStorage.getItem('onboarding_pet_photo') || null);
    const [petName, setPetName] = useState(sessionStorage.getItem('onboarding_pet_name') || '');
    const { selectPhoto } = usePhotoSelect();

    // 首次进入 step1 时保存来源路径（后续步骤间跳转不覆盖）
    if (!sessionStorage.getItem('onboarding_referrer')) {
        sessionStorage.setItem('onboarding_referrer', location.state?.from || '/');
    }
    const backLink = sessionStorage.getItem('onboarding_referrer') || '/';

    const takePicture = async () => {
        const result = await selectPhoto({
            promptLabelHeader: '选择照片来源',
            promptLabelPhoto: '从相册选择',
            promptLabelPicture: '拍照',
        });
        if (result) {
            setPetPhoto(result.dataUrl);
            sessionStorage.setItem('onboarding_pet_photo', result.dataUrl);
        }
    };

    const handleNext = () => {
        if (petName.trim()) {
            sessionStorage.setItem('onboarding_pet_name', petName);
            navigate('/onboarding/step2');
        }
    };

    return (
        <OnboardingLayout
            currentStep={1}
            totalSteps={3}
            backLink={backLink}
            onNext={handleNext}
            nextDisabled={!petName.trim()}
        >
            <div className="flex flex-col items-center pt-8">
                <div className="w-full max-w-sm space-y-8">
                    {/* 标题 */}
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
                            让我们认识你的宠物
                        </h2>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                            给你的毛孩子起一个可爱的名字吧
                        </p>
                    </div>

                    {/* 头像上传 */}
                    <button
                        onClick={takePicture}
                        className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-green-300/20 border-4 border-dashed border-primary/40 flex items-center justify-center overflow-hidden group hover:border-primary transition-all duration-300"
                    >
                        {petPhoto ? (
                            <>
                                <img src={petPhoto} alt="宠物头像" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-icons-round text-white text-3xl">photo_camera</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-primary">
                                <span className="material-icons-round text-4xl group-hover:scale-110 transition-transform">add_a_photo</span>
                                <span className="text-xs font-medium">添加照片</span>
                            </div>
                        )}
                    </button>

                    {/* 名字输入 */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft">
                        <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark ml-1 mb-4 block">
                            宠物名字
                        </label>
                        <div className="relative bg-background-light dark:bg-background-dark rounded-2xl shadow-inner transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                            <input
                                value={petName}
                                onChange={(e) => setPetName(e.target.value)}
                                className="w-full bg-transparent border-none py-4 pl-5 pr-12 text-lg font-medium text-text-main-light dark:text-text-main-dark focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 rounded-2xl"
                                placeholder="例如：Cooper"
                                type="text"
                                maxLength={20}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">🐾</span>
                        </div>
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
