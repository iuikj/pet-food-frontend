import { useEffect, useRef, useState } from 'react';
import AuthPanel from './AuthPanel';
import {
    Drawer,
    DrawerBar,
    DrawerClose,
    DrawerPanel,
    DrawerPopup,
} from '../ui/drawer';
import { Button } from '../ui/button';

export default function AuthDrawer({
    contextLabel,
    onClose,
    onModeChange,
    onSubmittingChange,
    onSuccess,
    open,
    submitting,
    view,
}) {
    const panelRef = useRef(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        if (!open || !window.visualViewport) return undefined;

        const updateKeyboardState = () => {
            const viewport = window.visualViewport;
            const keyboardIsVisible = window.innerHeight - viewport.height > 120;
            setKeyboardVisible(keyboardIsVisible);
        };

        updateKeyboardState();
        window.visualViewport.addEventListener('resize', updateKeyboardState);
        window.visualViewport.addEventListener('scroll', updateKeyboardState);
        return () => {
            window.visualViewport.removeEventListener('resize', updateKeyboardState);
            window.visualViewport.removeEventListener('scroll', updateKeyboardState);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;

        const handleFocusIn = (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            window.setTimeout(() => {
                target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 120);
        };

        const node = panelRef.current;
        node?.addEventListener('focusin', handleFocusIn);
        return () => node?.removeEventListener('focusin', handleFocusIn);
    }, [open]);

    return (
        <Drawer
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen && !submitting) onClose?.();
            }}
            position="bottom"
        >
            <DrawerPopup
                className="mx-auto max-w-[430px] bg-background-light dark:bg-background-dark [--drawer-height:min(96dvh,820px)]"
                showBar={false}
            >
                <DrawerBar />
                <DrawerClose
                    aria-label="关闭登录面板"
                    className="absolute right-4 top-4 z-10 rounded-full"
                    disabled={submitting}
                    render={<Button size="icon-sm" variant="ghost" />}
                >
                    <span className="material-icons-round">close</span>
                </DrawerClose>
                <DrawerPanel
                    ref={panelRef}
                    className={`flex min-h-0 flex-1 flex-col px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] pt-9 ${
                        keyboardVisible ? 'pb-6' : ''
                    }`}
                >
                    <AuthPanel
                        contextLabel={contextLabel}
                        mode="drawer"
                        onModeChange={onModeChange}
                        onSubmittingChange={onSubmittingChange}
                        onSuccess={onSuccess}
                        view={view}
                    />
                </DrawerPanel>
            </DrawerPopup>
        </Drawer>
    );
}
