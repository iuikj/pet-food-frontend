# Capacitor 安卓端前后端联调问题排查与解决方案

> 作者：AI 助手  
> 日期：2026-02-08  
> 适用项目：web-app (Capacitor + React)

---

## 问题描述

将前端 Web 应用通过 Capacitor 打包成安卓 APK 后，安装到手机上无法与本地后端 API 通信。

---

## 根本原因

### 原因一：Vite 环境变量打包机制（⚠️ 技术关键点）

Vite 在 **构建时（build time）** 将 `.env` 中的 `VITE_` 前缀变量**硬编码**到打包后的 JS 文件中：

```javascript
// 源代码
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// 打包后（环境变量被替换为实际值）
const API_BASE_URL = "http://172.29.160.136:8000/api/v1";
```

**常见错误：**
1. 修改 `.env` 后**忘记重新 `npm run build`** → 打包文件中仍是旧 IP
2. `.env` 中的 IP 与**当前网络环境不匹配**（切换 WiFi/热点后 IP 会变化）

**验证方法：**
```powershell
# 检查打包后的 API 地址是否与 .env 一致
Select-String -Path "dist\assets\index-*.js" -Pattern "http://.*:8000/api/v1"
```

### 原因二：路由器 WiFi 开启了 AP 隔离（测试环境注意事项）

AP 隔离是一种安全功能，阻止同一 WiFi 网络下的设备相互通信。这会导致：
- 手机和电脑连接同一 WiFi
- 电脑上的后端服务正常运行
- 但手机 App 无法访问电脑上的服务

---

## 解决方案

### 方案一：使用手机热点（推荐用于开发调试）

1. 手机开启热点
2. 电脑连接手机热点
3. 获取电脑在热点下的新 IP 地址：
   ```powershell
   ipconfig | Select-String "IPv4"
   ```
4. 更新前端 `.env` 文件：
   ```bash
   VITE_API_BASE_URL=http://新IP地址:8000/api/v1
   ```
5. **重新构建并同步（必需！）：**
   ```bash
   npm run build
   npx cap sync
   ```
6. 重新构建 APK 或使用 Android Studio 运行

### 方案二：关闭路由器 AP 隔离

1. 登录路由器管理页面（通常是 192.168.1.1）
2. 找到"无线设置" → "AP 隔离"或"客户端隔离"
3. 关闭此功能
4. 保存并重启路由器

### 方案三：部署到公网服务器

适用于正式环境，将后端部署到有公网 IP 的服务器。

---

## 排查清单

| # | 检查项 | 验证方法 | 本次状态 |
|---|--------|----------|----------|
| 1 | 后端服务是否运行 | 浏览器访问 `http://IP:8000/health` | ✅ |
| 2 | CORS 是否配置正确 | 检查响应头 `Access-Control-Allow-Origin` | ✅ |
| 3 | 前端 `.env` IP 地址 | 确认与电脑当前 IP 一致 | ✅ |
| 4 | **打包后 dist 中的 IP** | 用 `Select-String` 检查 JS 文件 | ⚠️ 需验证 |
| 5 | Android 明文流量 | 检查 `AndroidManifest.xml` | ✅ |
| 6 | 手机能否直接访问后端 | 手机浏览器访问 `http://IP:8000/docs` | ❌ 失败 |
| 7 | WiFi AP 隔离 | 切换到手机热点测试 | ✅ 切换后成功 |

---

## 相关配置文件

### 1. 前端 `.env`
```bash
VITE_API_BASE_URL=http://172.29.160.136:8000/api/v1
VITE_ENABLE_SSE=true
VITE_RECONNECT_DELAY=3000
```

### 2. `capacitor.config.json`
```json
{
  "server": {
    "androidScheme": "https",
    "cleartext": true
  },
  "android": {
    "allowMixedContent": true
  }
}
```

### 3. `android/app/src/main/AndroidManifest.xml`
```xml
<application
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config">
```

### 4. `android/app/src/main/res/xml/network_security_config.xml`
```xml
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

---

## 经验总结

1. **每次修改 `.env` 必须重新 `npm run build` + `npx cap sync`** - Vite 在构建时注入环境变量
2. **验证打包后的 API 地址** - 不要假设 `.env` 修改后自动生效
3. **手机热点是快速验证网络问题的有效方法** - 绕过路由器的各种限制
4. **后端启动时必须绑定 `0.0.0.0`** - 否则只能本机访问
5. **SSE 在 Capacitor Android 上有已知兼容问题** - 可能需要使用 WebSocket 替代

---

## 快速调试命令

```powershell
# 查看本机 IP
ipconfig | Select-String "IPv4"

# 测试后端是否可达
Invoke-RestMethod -Uri "http://IP:8000/health"

# 重新构建前端
npm run build
npx cap sync

# 检查打包后的 API 地址（关键！）
Select-String -Path "dist\assets\index-*.js" -Pattern "http://.*:8000/api/v1"
```
