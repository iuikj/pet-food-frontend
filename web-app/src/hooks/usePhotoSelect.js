import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * 将 base64 data URL 转换为 Blob。
 * 不依赖 fetch(dataUrl)，兼容所有 WebView 环境。
 */
function dataUrlToBlob(dataUrl) {
    const [meta, base64] = dataUrl.split(',');
    const mime = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
}

/**
 * 统一封装拍照/相册选图。
 * - Native: 调用 Capacitor Camera
 * - Web: 使用 input[type="file"]
 */
export default function usePhotoSelect() {
    const selectPhoto = useCallback(async (options = {}) => {
        const {
            quality = 90,
            width = 500,
            height = 500,
            fileName = 'photo.jpg',
            promptLabelHeader = '选择头像来源',
            promptLabelPhoto = '从相册选择',
            promptLabelPicture = '拍照',
        } = options;

        if (Capacitor.isNativePlatform()) {
            try {
                const image = await Camera.getPhoto({
                    quality,
                    allowEditing: false,
                    resultType: CameraResultType.DataUrl,
                    source: CameraSource.Prompt,
                    width,
                    height,
                    saveToGallery: false,
                    promptLabelHeader,
                    promptLabelPhoto,
                    promptLabelPicture,
                });
                const dataUrl = image.dataUrl;
                const blob = dataUrlToBlob(dataUrl);
                const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
                return { dataUrl, file };
            } catch (err) {
                // 用户主动取消时 Camera 会抛出 "User cancelled"，不需要提示
                if (err?.message?.includes('cancel')) {
                    return null;
                }
                console.error('[usePhotoSelect] native camera error:', err);
                return null;
            }
        }

        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';

            input.addEventListener('change', () => {
                const selected = input.files?.[0];
                if (!selected) {
                    resolve(null);
                    return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                    resolve({ dataUrl: reader.result, file: selected });
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(selected);
            });

            const onFocus = () => {
                window.removeEventListener('focus', onFocus);
                setTimeout(() => {
                    if (!input.files?.length) {
                        resolve(null);
                    }
                    input.remove();
                }, 300);
            };

            window.addEventListener('focus', onFocus);
            document.body.appendChild(input);
            input.click();
        });
    }, []);

    return { selectPhoto };
}
