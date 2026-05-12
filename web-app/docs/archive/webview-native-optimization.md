# WebView 移动端原生化优化经验

> 本文档记录了在 Android WebView 中实现原生化体验的最佳实践和解决方案。

## 元信息

| 属性 | 值 |
|------|-----|
| 日期 | 2026-02-09 |
| 项目 | 宠物饮食计划 App |
| 环境 | Android WebView + React + Vite |
| 框架 | Tailwind CSS + Framer Motion |

---

## 问题与解决方案

### 1. 软键盘遮挡表单

**问题描述**  
在 Android WebView 中，软键盘弹出时会遮挡页面底部的登录按钮和社交登录组件。

**解决方案**
```css
/* 使用动态视口高度 */
.container {
  min-height: 100dvh; /* dvh = dynamic viewport height */
}
```

```javascript
// 监听视口变化，检测键盘状态
useEffect(() => {
  const handleResize = () => {
    const isSmall = window.innerHeight < 500;
    setIsKeyboardVisible(isSmall);
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport.removeEventListener('resize', handleResize);
  }
}, []);
```

**优化策略**
- 键盘弹出时自动隐藏非核心元素（Logo、社交登录区域）
- 使用 Framer Motion 实现平滑过渡动画

---

### 2. 浏览器原生验证气泡

**问题描述**  
HTML5 表单的 `type="email"` 会触发浏览器原生验证气泡，破坏 App 的视觉一致性。

**解决方案**
```jsx
{/* 在 form 元素添加 noValidate 属性 */}
<form onSubmit={handleSubmit} noValidate>
  {/* 使用自定义 FormField 组件处理验证 */}
  <FormField
    type="email"
    error={fieldErrors.email}
    required
  />
</form>
```

**FormField 组件特性**
- 输入框下方显示红色错误提示
- 错误状态边框变红
- 支持自定义验证函数
- 密码可见/隐藏切换

---

### 3. 浏览器原生 Confirm 弹窗

**问题描述**  
使用 `window.confirm()` 会显示浏览器原生弹窗，视觉断层严重。

**解决方案**  
创建自定义 Modal 组件，支持多种类型：

```jsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleConfirm}
  title="退出登录"
  message="确定要退出吗？"
  type="danger"  // confirm | danger | success
  confirmText="退出"
  cancelText="取消"
/>
```

---

### 4. 缺乏点击反馈

**问题描述**  
点击按钮或卡片时没有视觉反馈，缺乏"原生感"。

**解决方案**
```css
/* 全局样式 - index.css */
.btn-active {
  @apply transition-transform duration-100 active:scale-[0.97] active:brightness-95;
}

.card-active {
  @apply transition-all duration-150 active:scale-[0.98] active:shadow-none;
}
```

```jsx
{/* 应用到组件 */}
<button className="... active:scale-[0.97] transition-all">
  登录
</button>
```

---

### 5. WebView 默认行为干扰

**问题描述**  
- 长按触发系统菜单
- 点击出现蓝色高亮
- 滚动卡顿

**解决方案**
```css
/* 禁用长按菜单 */
* {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* 允许输入框选择文本 */
input, textarea, [contenteditable="true"] {
  -webkit-user-select: text;
  user-select: text;
}

/* 禁用点击高亮 */
* {
  -webkit-tap-highlight-color: transparent;
}

/* 流畅滚动 */
html, body {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* 禁用输入框聚焦缩放 */
input, textarea, select {
  font-size: 16px !important;
}
```

---

## 组件清单

| 组件 | 路径 | 用途 |
|------|------|------|
| Modal | `src/components/Modal.jsx` | 替代 window.confirm |
| FormField | `src/components/FormField.jsx` | 自定义表单验证 |

---

## 修改文件汇总

| 文件 | 修改内容 |
|------|----------|
| `src/index.css` | WebView 原生化样式、点击反馈类 |
| `src/pages/Login.jsx` | 软键盘适配、noValidate、FormField |
| `src/pages/Profile.jsx` | Modal 替代 confirm |
| `src/pages/HomePage.jsx` | 空状态视觉优化 |
| `src/components/MealCard.jsx` | 点击反馈 |
| `src/components/PetCard.jsx` | 点击反馈 |

---

## 测试检查清单

- [ ] 登录页软键盘弹出时按钮可见
- [ ] 表单验证显示自定义错误提示（非浏览器气泡）
- [ ] 退出登录显示自定义 Modal
- [ ] 删除宠物显示自定义 Modal
- [ ] 所有按钮/卡片有点击缩放反馈
- [ ] 长按不触发系统菜单
- [ ] 滚动流畅无卡顿
