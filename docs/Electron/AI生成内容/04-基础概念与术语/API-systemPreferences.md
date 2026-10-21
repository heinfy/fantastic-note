# systemPreferences

`systemPreferences` 查询操作系统的偏好和隐私权限。主进程使用。最常被问到的是 macOS 的媒体权限和辅助功能权限。

文档：[https://www.electronjs.org/docs/latest/api/system-preferences](https://www.electronjs.org/docs/latest/api/system-preferences)

## 媒体权限

```js
const { systemPreferences } = require('electron');

const camera = systemPreferences.getMediaAccessStatus('camera');
const granted = await systemPreferences.askForMediaAccess('camera');
```

`getMediaAccessStatus` 的参数可以是 `camera`、`microphone`、`screen` 等。返回值包括 `granted`、`denied`、`restricted`、`not-determined`。

`askForMediaAccess` 可以主动弹出摄像头和麦克风的系统框。屏幕录制不能用它来弹出授权，只能查询；需要引导用户到系统设置里勾选。打包的 `Info.plist` 要包含用途说明，例如 `NSCameraUsageDescription`，否则请求可能直接失败。

## 辅助功能

```js
const trusted = systemPreferences.isTrustedAccessibilityClient(false);
if (!trusted) {
  systemPreferences.isTrustedAccessibilityClient(true);
}
```

参数为 `true` 时会提示用户打开辅助功能权限。全局键盘监听、模拟点击需要这项权限。普通的 `globalShortcut` 注册不需要它。

## 其他

Windows 上可以用它读取系统配色、强调色等设置。主题跟随更直接的入口是 `nativeTheme`。

macOS 的隐私授权按应用签名记录。用 Electron 二进制开发时同意的权限，换上自己的正式签名后要重新同意。

## 相关文档

- [API-desktopCapturer](./API-desktopCapturer.md)
- [API-nativeTheme](./API-nativeTheme.md)
