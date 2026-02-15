import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
    presets: [
        presetUno(),
        presetIcons({
            scale: 1.2,
            extraProperties: {
                'display': 'inline-block',
                'vertical-align': 'middle',
            }
        })
    ],
    shortcuts: {
        'btn': 'px-4 py-2 rounded-lg font-medium transition-all duration-200',
        'btn-primary': 'btn bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700',
        'btn-secondary': 'btn bg-gray-100 text-gray-700 hover:bg-gray-200',
        'card': 'bg-white rounded-2xl p-4 shadow-sm',
        'flex-center': 'flex items-center justify-center',
    },
    theme: {
        colors: {
            primary: {
                DEFAULT: '#8B5CF6',
                50: '#F5F3FF',
                100: '#EDE9FE',
                500: '#8B5CF6',
                600: '#7C3AED',
                700: '#6D28D9',
            }
        }
    }
})
