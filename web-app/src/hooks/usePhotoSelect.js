import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * 平台感知的照片选择 hook。
 * - Native (Capacitor): Camera.getPhoto + CameraSource.Prompt
 * - Web: 隐藏 <input type="file"> 触发浏览器文件选择器
 *
 * @returns {{ selectPhoto: (options?) => Promise<{ dataUrl: string, file: File } | null> }}
 */
export default function usePhotoSelect() {
    const selectPhoto = useCallback(async (options = {}) => {
        const {
            quality = 90,
            width = 500,
            height = 500,
            fileName = 'photo.jpg',
            promptLabelHeader = '选择照片来源',
            promptLabelPhoto = '从相册选择',
            promptLabelPicture = '拍照',
        } = options;

        if (Capacitor.isNativePlatform()) {
            // Native 路径
            try {
                const image = await Camera.getPhoto({
                    quality,
                    allowEditing: true,
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
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
                return { dataUrl, file };
            } catch (_err) {
                // 用户取消或权限拒绝
                return null;
            }
        }

        // Web 路径：隐藏 input
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

            // 用户取消文件对话框 — focus 回到窗口时若无文件则视为取消
            const onFocus = () => {
                window.removeEventListener('focus', onFocus);
                setTimeout(() => {
                    if (!input.files?.length) resolve(null);
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
