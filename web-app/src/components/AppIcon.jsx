import React from 'react'
import appIconSrc from '../../assets/temp_icon.png'

/**
 * 应用图标组件 - 统一入口
 *
 * 用途：登录页、启动页、关于页等需要显示应用图标的地方
 *
 * @param {Object} props
 * @param {string} [props.size='md'] - 尺寸：'sm' | 'md' | 'lg' | 'xl'
 * @param {string} [props.className] - 额外的 CSS 类名
 */
export default function AppIcon({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  }

  return (
    <div className={`inline-flex items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-lg ${sizeClasses[size]} ${className}`}>
      <img
        src={appIconSrc}
        alt="宠物饮食助手"
        className="w-full h-full object-cover rounded-3xl"
      />
    </div>
  )
}
