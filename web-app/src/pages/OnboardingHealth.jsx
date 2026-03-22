import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePets } from '../hooks/usePets';
import OnboardingLayout from '../components/OnboardingLayout';
import EnhancedTagSelect from '../components/EnhancedTagSelect';

export default function OnboardingHealth() {
    const navigate = useNavigate();
    const { addPet, uploadPetAvatar } = usePets();

    const [allergens, setAllergens] = useState([]);
    const [healthIssues, setHealthIssues] = useState([]);
    const [allergenInput, setAllergenInput] = useState('');
    const [issueInput, setIssueInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAddAllergen = (item) => {
        if (!allergens.includes(item)) {
            setAllergens([...allergens, item]);
        }
    };

    const handleRemoveAllergen = (item) => {
        setAllergens(allergens.filter(i => i !== item));
    };

    const handleAddIssue = (item) => {
        if (!healthIssues.includes(item)) {
            setHealthIssues([...healthIssues, item]);
        }
    };

    const handleRemoveIssue = (item) => {
        setHealthIssues(healthIssues.filter(i => i !== item));
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            const name = sessionStorage.getItem('onboarding_pet_name');
            const species = sessionStorage.getItem('onboarding_pet_species');
            const breed = sessionStorage.getItem('onboarding_pet_breed');
            const age = parseInt(sessionStorage.getItem('onboarding_pet_age') || '0');
            const weight = parseFloat(sessionStorage.getItem('onboarding_pet_weight') || '0');
            const avatarBase64 = sessionStorage.getItem('onboarding_pet_photo');

            if (!name) {
                alert('缺少必要信息，请返回重新填写');
                setSubmitting(false);
                return;
            }

            const petData = {
                name,
                type: species === 'Dog' ? 'dog' : 'cat',
                breed,
                age,
                weight,
                health_status: healthIssues.join(', ') || '健康',
                special_requirements: allergens.length > 0 ? `过敏: ${allergens.join(', ')}` : ''
            };

            const result = await addPet(petData);
            if (result.success && result.pet) {
                const petId = result.pet.id;

                if (avatarBase64) {
                    try {
                        const response = await fetch(avatarBase64);
                        const blob = await response.blob();
                        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
                        await uploadPetAvatar(petId, file);
                    } catch (e) {
                        console.error('头像处理/上传失败', e);
                    }
                }

                // 清除 sessionStorage
                sessionStorage.removeItem('onboarding_pet_name');
                sessionStorage.removeItem('onboarding_pet_species');
                sessionStorage.removeItem('onboarding_pet_breed');
                sessionStorage.removeItem('onboarding_pet_age');
                sessionStorage.removeItem('onboarding_pet_age_years');
                sessionStorage.removeItem('onboarding_pet_age_months');
                sessionStorage.removeItem('onboarding_pet_weight');
                sessionStorage.removeItem('onboarding_pet_photo');

                const referrer = sessionStorage.getItem('onboarding_referrer') || '/';
                sessionStorage.removeItem('onboarding_referrer');
                navigate(referrer);
            } else {
                alert(result.message || '创建宠物失败');
                setSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            alert('发生错误');
            setSubmitting(false);
        }
    };

    return (
        <OnboardingLayout
            currentStep={3}
            totalSteps={3}
            backLink="/onboarding/step2"
            onNext={handleSave}
            nextDisabled={false}
            nextLabel="完成"
            isSubmitting={submitting}
        >
            <div className="flex flex-col items-center pt-2">
                <div className="w-full max-w-sm space-y-6">
                    {/* 标题 */}
                    <div className="space-y-2 text-center mb-6">
                        <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">健康信息</h2>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">有什么过敏或需要注意的健康问题吗？</p>
                    </div>

                    {/* 过敏源 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">过敏源</label>
                        </div>
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft">
                            <div className="flex flex-wrap gap-2 mb-2 items-center min-h-[40px]">
                                {allergens.map(item => (
                                    <span key={item} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-green-900 dark:text-green-100 text-sm font-medium">
                                        {item}
                                        <button
                                            onClick={() => handleRemoveAllergen(item)}
                                            className="ml-1 -mr-1 h-4 w-4 rounded-full flex items-center justify-center text-green-700 dark:text-green-200 hover:bg-primary/30"
                                            type="button"
                                        >
                                            <span className="material-icons-round text-xs">close</span>
                                        </button>
                                    </span>
                                ))}
                                <input
                                    className="flex-1 min-w-[100px] border-none focus:ring-0 bg-transparent text-sm text-text-main-light dark:text-text-main-dark p-0"
                                    placeholder="如：玉米、小麦、鸡蛋等..."
                                    type="text"
                                    value={allergenInput}
                                    onChange={e => setAllergenInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && allergenInput.trim()) {
                                            handleAddAllergen(allergenInput.trim());
                                            setAllergenInput('');
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <EnhancedTagSelect
                            options={['鸡肉', '牛肉', '乳制品', '海鲜/鱼', '羊肉']}
                            selected={allergens}
                            onChange={setAllergens}
                            multiple={true}
                            clearLabel="无"
                            onClear={() => setAllergens([])}
                        />
                    </div>

                    {/* 健康困扰 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">近期健康困扰</label>
                        </div>
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-soft">
                            <div className="flex flex-wrap gap-2 mb-2 items-center min-h-[40px]">
                                {healthIssues.map(item => (
                                    <span key={item} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-green-900 dark:text-green-100 text-sm font-medium">
                                        {item}
                                        <button
                                            onClick={() => handleRemoveIssue(item)}
                                            className="ml-1 -mr-1 h-4 w-4 rounded-full flex items-center justify-center text-green-700 dark:text-green-200 hover:bg-primary/30"
                                            type="button"
                                        >
                                            <span className="material-icons-round text-xs">close</span>
                                        </button>
                                    </span>
                                ))}
                                <input
                                    className="flex-1 min-w-[100px] border-none focus:ring-0 bg-transparent text-sm text-text-main-light dark:text-text-main-dark p-0"
                                    placeholder="如：关节炎、肠胃敏感、肥胖等..."
                                    type="text"
                                    value={issueInput}
                                    onChange={e => setIssueInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && issueInput.trim()) {
                                            handleAddIssue(issueInput.trim());
                                            setIssueInput('');
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <EnhancedTagSelect
                            options={[
                                { icon: 'healing', text: '皮肤瘙痒' },
                                { icon: 'monitor_weight', text: '体重超标' },
                                { icon: 'sentiment_dissatisfied', text: '软便/拉稀' },
                                { icon: 'restaurant', text: '挑食' }
                            ]}
                            selected={healthIssues}
                            onChange={setHealthIssues}
                            multiple={true}
                            clearLabel="无"
                            onClear={() => setHealthIssues([])}
                        />
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
