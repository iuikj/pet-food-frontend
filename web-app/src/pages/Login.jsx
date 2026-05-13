import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import AppIcon from '../components/AppIcon';
import AuthPanel from '../components/auth/AuthPanel';
import { isManualOverride, isMockMode, setMockMode } from '../mock/mockMode';

function MockModeControls() {
    const [mockEnabled, setMockEnabled] = useState(() => isMockMode());
    const [showMockOverride] = useState(() => isManualOverride());

    return (
        <div className="space-y-3">
            {mockEnabled && !showMockOverride ? (
                <Motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-amber-50 p-3 text-center text-xs text-amber-700 backdrop-blur-sm dark:bg-amber-900/20 dark:text-amber-400"
                    initial={{ opacity: 0, y: 10 }}
                >
                    <span className="material-icons-round mr-1 align-middle text-sm">info</span>
                    未检测到后端服务，已自动切换为演示模式
                </Motion.div>
            ) : null}

            <div className="flex items-center justify-center gap-3 text-xs text-text-muted-light dark:text-text-muted-dark">
                <span className={!mockEnabled ? 'font-semibold text-primary' : ''}>真实 API</span>
                <button
                    aria-checked={mockEnabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                        mockEnabled ? 'bg-amber-400' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    onClick={() => {
                        const next = !mockEnabled;
                        setMockMode(next);
                        setMockEnabled(next);
                        window.location.reload();
                    }}
                    role="switch"
                    type="button"
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            mockEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
                <span className={mockEnabled ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>演示模式</span>
            </div>
        </div>
    );
}

export default function Login() {
    const navigate = useNavigate();

    return (
        <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-primary/5 via-background-light to-secondary/10 dark:from-gray-900 dark:via-background-dark dark:to-gray-800">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
            </div>

            <Motion.main
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex flex-1 flex-col justify-center px-6 py-8"
                initial={{ opacity: 0, y: 20 }}
            >
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-7 text-center">
                        <AppIcon className="mb-4" size="md" />
                    </div>
                    <AuthPanel
                        mockControls={<MockModeControls />}
                        onSuccess={() => navigate('/')}
                        showMockControls
                    />
                </div>
            </Motion.main>
        </div>
    );
}
