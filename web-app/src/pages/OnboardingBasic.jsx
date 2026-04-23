import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toMonths } from '../utils/petUtils';
import OnboardingLayout from '../components/OnboardingLayout';
import PetIcon from '../components/icons/PetIcon';
import WheelPicker from '../components/ui/WheelPicker';
import WeightScale from '../components/ui/WeightScale';

export default function OnboardingBasic() {
    const navigate = useNavigate();
    const [species, setSpecies] = useState(sessionStorage.getItem('onboarding_pet_species') || 'Dog');
    const [breed, setBreed] = useState(sessionStorage.getItem('onboarding_pet_breed') || '');
    const [ageYears, setAgeYears] = useState(sessionStorage.getItem('onboarding_pet_age_years') || '');
    const [ageMonths, setAgeMonths] = useState(sessionStorage.getItem('onboarding_pet_age_months') || '');
    const [weight, setWeight] = useState(sessionStorage.getItem('onboarding_pet_weight') || '');
    const [gender, setGender] = useState(sessionStorage.getItem('onboarding_pet_gender') || '');

    const handleNext = () => {
        if (breed && (ageYears || ageMonths) && weight) {
            const totalMonths = toMonths(ageYears, ageMonths);
            sessionStorage.setItem('onboarding_pet_species', species);
            sessionStorage.setItem('onboarding_pet_breed', breed);
            sessionStorage.setItem('onboarding_pet_age', totalMonths.toString());
            sessionStorage.setItem('onboarding_pet_age_years', ageYears);
            sessionStorage.setItem('onboarding_pet_age_months', ageMonths);
            sessionStorage.setItem('onboarding_pet_weight', weight);
            if (gender) {
                sessionStorage.setItem('onboarding_pet_gender', gender);
            } else {
                sessionStorage.removeItem('onboarding_pet_gender');
            }
            navigate('/onboarding/step3');
        }
    };

    return (
        <OnboardingLayout
            currentStep={2}
            totalSteps={3}
            backLink="/onboarding/step1"
            onNext={handleNext}
            nextDisabled={!breed || (!ageYears && !ageMonths) || !weight}
        >
            <div className="flex flex-col items-center pt-2">
                <div className="w-full max-w-sm space-y-6">
                    {/* 标题 */}
                    <div className="space-y-2 text-center mb-6">
                        <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">基本信息</h2>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">告诉我们更多关于你的宠物</p>
                    </div>

                    {/* 物种选择 */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft">
                        <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark ml-1 mb-4 block">物种</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'Dog', type: 'dog', label: '狗狗' },
                                { value: 'Cat', type: 'cat', label: '猫咪' }
                            ].map(item => (
                                <button
                                    key={item.value}
                                    onClick={() => setSpecies(item.value)}
                                    className={`py-4 rounded-2xl text-lg font-bold transition-all duration-200 flex items-center justify-center gap-3 ${species === item.value
                                            ? 'bg-primary text-white shadow-glow scale-[1.02]'
                                            : 'bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <PetIcon type={item.type} size={28} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 性别选择 */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft">
                        <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark ml-1 mb-4 block">性别（可选）</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'male', label: '♂ 公' },
                                { value: 'female', label: '♀ 母' },
                            ].map(item => (
                                <button
                                    key={item.value}
                                    onClick={() => setGender(gender === item.value ? '' : item.value)}
                                    className={`py-3 rounded-2xl text-base font-bold transition-all duration-200 ${gender === item.value
                                            ? 'bg-primary text-white shadow-glow scale-[1.02]'
                                            : 'bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 品种输入 */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft">
                        <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark ml-1 mb-4 block">品种</label>
                        <div className="relative bg-background-light dark:bg-background-dark rounded-2xl shadow-inner transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow">
                            <input
                                value={breed}
                                onChange={(e) => setBreed(e.target.value)}
                                className="w-full bg-transparent border-none py-4 pl-5 pr-12 text-base font-medium text-text-main-light dark:text-text-main-dark focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 rounded-2xl"
                                placeholder="例如：金毛寻回犬"
                                type="text"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-icons-round text-primary/50">pets</span>
                        </div>
                    </div>

                    {/* 年龄输入 — 滚轮选择器 */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft space-y-4">
                        <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark ml-1 block">年龄</label>
                        <div className="grid grid-cols-2 gap-4">
                            <WheelPicker
                                items={Array.from({ length: 31 }, (_, i) => ({ value: i, label: String(i) }))}
                                value={Number(ageYears) || 0}
                                onChange={(v) => setAgeYears(v)}
                                unit="岁"
                            />
                            <WheelPicker
                                items={Array.from({ length: 12 }, (_, i) => ({ value: i, label: String(i) }))}
                                value={Number(ageMonths) || 0}
                                onChange={(v) => setAgeMonths(v)}
                                unit="月"
                            />
                        </div>
                    </div>

                    {/* 体重输入 — 刻度尺 */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft">
                        <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark ml-1 mb-3 block">体重</label>
                        <WeightScale
                            value={Number(weight) || 0}
                            onChange={(v) => setWeight(v)}
                            min={0}
                            max={100}
                            step={0.1}
                        />
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
