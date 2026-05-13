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

function addToast(message, options = {}) {
    toastManager.add(toToastOptions(message, options));
}

/**
 * COSS Toast 通知。Native WebView 与 Web 统一走同一个 toastManager。
 */
export async function showToast(message, duration = 'short') {
    addToast(message, { timeout: getTimeout(duration) });
}

showToast.success = async (message, duration = 'short') => {
    addToast(message, { type: 'success', timeout: getTimeout(duration) });
};

showToast.error = async (message, duration = 'long') => {
    addToast(message, { type: 'error', timeout: getTimeout(duration), priority: 'high' });
};

showToast.info = async (message, duration = 'short') => {
    addToast(message, { type: 'info', timeout: getTimeout(duration) });
};

showToast.promise = (promise, messages) => {
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
    addToast(message, {
        timeout: getTimeout(duration),
        actionProps: {
            children: actionLabel,
            onClick: onAction,
        },
    });
};
