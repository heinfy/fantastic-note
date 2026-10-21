# macOS 系统权限（屏幕录制/辅助功能/摄像头）如何检测和申请？

## 考察点

- macOS TCC 权限体系的理解
- systemPreferences API 的使用边界

## 参考答案

### 1. macOS 权限体系（TCC）

macOS 用 TCC（Transparency, Consent, and Control）管理敏感权限。对 Electron 开发者分两类：

- **可直接弹窗申请**：摄像头、麦克风
- **只能检测 + 引导用户手动开启**：屏幕录制、辅助功能、完全磁盘访问

### 2. 摄像头 / 麦克风（可主动申请）

```js
const { systemPreferences } = require('electron');

// 查询状态：'granted' | 'denied' | 'not-determined' | 'restricted'
const status = systemPreferences.getMediaAccessStatus('camera');

if (status === 'not-determined') {
  // 首次调用会弹系统授权框
  const granted = await systemPreferences.askForMediaAccess('camera');
}
```

前提：打包时 Info.plist 必须声明用途描述，否则**直接崩溃**：

```xml
<key>NSCameraUsageDescription</key>
<string>需要摄像头权限用于视频通话</string>
<key>NSMicrophoneUsageDescription</key>
<string>需要麦克风权限用于语音采集</string>
```

### 3. 屏幕录制权限（agent 高频，只能引导）

```js
// 只能查询，查询本身不会弹窗
const status = systemPreferences.getMediaAccessStatus('screen');
// 'granted' 或 'denied'（未授权也返回 denied，无法区分"未问过"）

if (status !== 'granted') {
  // 方案一：打开系统设置对应面板，引导用户手动勾选
  shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
  );
}
```

实践技巧：
- 触发一次 `desktopCapturer.getSources()` 会让系统把应用列入屏幕录制列表（未勾选状态），用户打开设置就能直接勾
- 授权后**需要重启应用才生效**（TCC 缓存），检测到授权后提示用户重启

### 4. 辅助功能权限（全局监听/模拟输入必需）

```js
// 查询（传 false 只查不弹）
const trusted = systemPreferences.isTrustedAccessibilityClient(false);

if (!trusted) {
  // 传 true 会弹系统提示，引导用户去设置开启
  systemPreferences.isTrustedAccessibilityClient(true);
}
```

### 5. 开发期的坑（真实项目必遇）

**TCC 按签名/bundle id 记录授权**：开发时用 electron 二进制跑，授权给了 "Electron.app"；打包后换成自己的签名，授权不继承。调试时可用命令重置：

```bash
# 重置某应用的屏幕录制权限（调试用）
tccutil reset ScreenCapture com.yourcompany.myagent
tccutil reset All com.yourcompany.myagent  # 重置全部
```

**未签名的开发包申请权限行为诡异**（授权框不弹、状态乱跳），权限相关逻辑一定要用**签名+公证后的包**验证。

### 6. 权限引导的工程化

- 功能入口前置检测：未授权时展示引导页（截图标注"请勾选 XX 应用"）而不是静默失败
- 轮询检测授权状态（用户从设置页回来后自动继续流程）
- 把权限申请放在功能首次使用时，而不是应用启动时连环弹窗

## 面试话术

> 摄像头/麦克风走 askForMediaAccess 主动申请；屏幕录制和辅助功能只能 getMediaAccessStatus/isTrustedAccessibilityClient 检测，然后 openExternal 跳系统设置引导。工程上注意三点：Info.plist 声明、授权后需重启生效、以及 TCC 绑定签名导致开发包和正式包授权不互通。

## 常见追问

- **Windows 有类似问题吗？** 基本没有这种细粒度权限，主要是管理员权限（UAC），技术路线完全不同。
- **如何感知用户开启了权限？** 无事件通知，窗口聚焦时重新查询，或定时轮询。
