import { Capacitor } from '@capacitor/core';
import { toastManager } from '@/components/ui/toast';

const DURATION_MS = {
    short: 2500,
    long: 5000,
};

function getTimeout(duration = 'short') {
    return DURATION_MS[duration] ?? DURATION_MS.short;
}

function toToastOptions(message, options = {}) {
    if (typeof message === 'object' && message !== null) {
        return {
            timeout: getTimeout(options.duration),
            ...message,
        };
    }

    return {
        title: message,
        timeout: getTimeout(options.duration),
        ...options,
    };
}

async function showNativeToast(message, duration = 'short') {
    const { Toast } = await import('@capacitor/toast');
    await Toast.show({
        text: typeof message === 'string' ? message : message?.title || '',
        duration,
    });
}

function addWebToast(message, options = {}) {
    toastManager.add(toToastOptions(message, options));
}

/**
 * 跨平台 Toast 通知。
 * - Native: @capacitor/toast
 * - Web: coss toastManager
 */
export async function showToast(message, duration = 'short') {
    if (Capacitor.isNativePlatform()) {
        try {
            await showNativeToast(message, duration);
        } catch {
            addWebToast(message, { timeout: getTimeout(duration) });
        }
    } else {
        addWebToast(message, { timeout: getTimeout(duration) });
    }
}

showToast.success = async (message, duration = 'short') => {
    if (Capacitor.isNativePlatform()) {
        return showNativeToast(message, duration);
    }
    addWebToast(message, { type: 'success', timeout: getTimeout(duration) });
};

showToast.error = async (message, duration = 'long') => {
    if (Capacitor.isNativePlatform()) {
        return showNativeToast(message, duration);
    }
    addWebToast(message, { type: 'error', timeout: getTimeout(duration), priority: 'high' });
};

showToast.info = async (message, duration = 'short') => {
    if (Capacitor.isNativePlatform()) {
        return showNativeToast(message, duration);
    }
    addWebToast(message, { type: 'info', timeout: getTimeout(duration) });
};

showToast.promise = (promise, messages) => {
    if (Capacitor.isNativePlatform()) {
        return promise
            .then(async (result) => {
                const success = typeof messages.success === 'function'
                    ? messages.success(result)
                    : messages.success;
                if (success) {
                    await showNativeToast(typeof success === 'string' ? success : success.title);
                }
                return result;
            })
            .catch(async (error) => {
                const errorMessage = typeof messages.error === 'function'
                    ? messages.error(error)
                    : messages.error;
                if (errorMessage) {
                    await showNativeToast(typeof errorMessage === 'string' ? errorMessage : errorMessage.title, 'long');
                }
                throw error;
            });
    }

    return toastManager.promise(promise, {
        loading: typeof messages.loading === 'string'
            ? { title: messages.loading, type: 'loading', timeout: 0 }
            : { type: 'loading', timeout: 0, ...messages.loading },
        success: (result) => {
            const success = typeof messages.success === 'function'
                ? messages.success(result)
                : messages.success;
            return typeof success === 'string'
                ? { title: success, type: 'success', timeout: getTimeout('short') }
                : { type: 'success', timeout: getTimeout('short'), ...success };
        },
        error: (error) => {
            const errorMessage = typeof messages.error === 'function'
                ? messages.error(error)
                : messages.error;
            return typeof errorMessage === 'string'
                ? { title: errorMessage, type: 'error', timeout: getTimeout('long'), priority: 'high' }
                : { type: 'error', timeout: getTimeout('long'), priority: 'high', ...errorMessage };
        },
    });
};

showToast.action = async (message, actionLabel, onAction, duration = 'long') => {
    if (Capacitor.isNativePlatform()) {
        return showNativeToast(message, duration);
    }

    addWebToast(message, {
        timeout: getTimeout(duration),
        actionProps: {
            children: actionLabel,
            onClick: onAction,
        },
    });
};
