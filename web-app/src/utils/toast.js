import { Capacitor } from '@capacitor/core';
import { toast as sonnerToast } from 'sonner';

/**
 * 跨平台 Toast 通知。
 * - Native: @capacitor/toast
 * - Web: sonner
 */
export async function showToast(message, duration = 'short') {
    if (Capacitor.isNativePlatform()) {
        try {
            const { Toast } = await import('@capacitor/toast');
            await Toast.show({ text: message, duration });
        } catch {
            sonnerToast(message);
        }
    } else {
        sonnerToast(message, { duration: duration === 'long' ? 5000 : 2500 });
    }
}
