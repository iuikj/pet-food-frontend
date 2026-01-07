# Capacitor 8 项目依赖版本配置指南

本文档总结了 Capacitor 8 项目的依赖版本要求、常见问题及解决方案。

---

## 版本依赖矩阵

| 依赖项 | 版本要求 | 说明 |
|--------|----------|------|
| **Node.js** | ≥22.x | 推荐使用 LTS 版本 |
| **Java (JDK)** | 21 | 必须使用 JDK 21，不支持 JDK 20 或更低版本 |
| **Android Gradle Plugin (AGP)** | 8.12+ | Gradle 8.14.x 兼容 |
| **Gradle** | 8.14.x | 由 AGP 8.12 自动匹配 |
| **Android SDK** | compileSdk/targetSdk = 36 | minSdk = 24 |
| **Capacitor Core/CLI** | 8.0.0 | 需保持一致 |
| **@capacitor/android** | 8.0.0 | 需与 Core 版本匹配 |
| **@capacitor/background-runner** | 3.0.0 | 兼容 Capacitor 8 |

---

## 常见问题与解决方案

### 1. Java 版本错误

**错误信息**:
```
错误: 无效的源发行版：21
```

**原因**: `JAVA_HOME` 环境变量指向 JDK 20 或更低版本

**解决方案**: 在 `android/gradle.properties` 中指定 JDK 21 路径：
```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.9.10-hotspot
```

> ⚠️ **注意**: Windows 路径需要使用双反斜杠 `\\` 或正斜杠 `/`

---

### 2. Background Runner AAR 缺失

**错误信息**:
```
ModuleVersionNotFoundException: :android-js-engine-release
```

**原因**: `@capacitor/background-runner` 需要额外的 AAR 文件路径

**解决方案**: 在 `android/app/build.gradle` 的 `repositories` 块添加：
```groovy
repositories {
    flatDir {
        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
        dirs '../../node_modules/@capacitor/background-runner/android/src/main/libs', 'libs'
    }
}
```

---

### 3. minSdkVersion 冲突

**错误信息**:
```
uses-sdk:minSdkVersion X cannot be smaller than version Y
```

**解决方案**: 在 `android/variables.gradle` 中设置：
```groovy
ext {
    minSdkVersion = 24
    compileSdkVersion = 36
    targetSdkVersion = 36
}
```

---

### 4. AGP 版本配置

**文件**: `android/build.gradle`

```groovy
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.12.0'
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

---

## 项目配置清单

### ✅ 检查项

- [ ] Node.js ≥22.x (`node -v`)
- [ ] JDK 21 已安装 (`java -version`)
- [ ] `gradle.properties` 配置了正确的 `org.gradle.java.home`
- [ ] `variables.gradle` 配置了 SDK 36
- [ ] `build.gradle` 包含 background-runner libs 路径
- [ ] AGP 版本 ≥8.12.0

### 📋 快速验证命令

```bash
# 检查 Node.js 版本
node -v

# 检查 Java 版本
java -version

# 检查 Capacitor 配置
npx cap doctor

# 构建验证
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug
```

---

## 相关文件路径

| 文件 | 用途 |
|------|------|
| `android/gradle.properties` | JDK 路径、JVM 参数 |
| `android/variables.gradle` | SDK 版本、依赖版本 |
| `android/app/build.gradle` | 应用配置、repositories |
| `android/build.gradle` | 项目级 Gradle、AGP 版本 |
| `capacitor.config.json` | Capacitor 插件配置 |

---

## 参考资源

- [Capacitor 8 文档](https://capacitorjs.com/docs)
- [Background Runner 中文文档](https://capacitor.xuxo.top/docs/apis/background-runner)
