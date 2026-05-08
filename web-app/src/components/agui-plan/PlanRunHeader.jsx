import { ChevronLeft } from 'lucide-react';
import SecureImage from '../SecureImage';
import { Button } from '../ui/button';

/**
 * PlanRunHeader — sticky 顶栏，替代 PetHero。
 * 返回按钮 + 宠物头像 + 计划标题。
 */
export default function PlanRunHeader({ pet, onBack }) {
    return (
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-white/80 px-4 backdrop-blur-lg">
            <Button
                aria-label="返回"
                className="size-8 shrink-0 cursor-pointer rounded-full text-gray-600 hover:bg-gray-100"
                onClick={onBack}
                size="icon"
                type="button"
                variant="ghost"
            >
                <ChevronLeft className="size-5" />
            </Button>

            <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100">
                {pet?.avatar_url ? (
                    <SecureImage
                        src={pet.avatar_url}
                        alt={pet.name}
                        className="size-full object-cover"
                    />
                ) : (
                    <span className="text-sm font-semibold text-gray-500">
                        {pet?.name?.[0] ?? '?'}
                    </span>
                )}
            </div>

            <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-gray-900">
                {pet ? `${pet.name}的计划` : '生成计划'}
            </h1>
        </header>
    );
}
