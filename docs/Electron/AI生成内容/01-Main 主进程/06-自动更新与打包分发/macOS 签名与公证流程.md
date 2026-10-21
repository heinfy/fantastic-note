# macOS 签名与公证（notarization）流程？常见失败原因？

## 考察点

- Developer ID 签名 + 公证的完整链路
- hardened runtime、entitlements 等概念
- 真实踩坑经验

## 参考答案

### 1. 为什么需要签名 + 公证

macOS Gatekeeper 对从网络下载的应用做安全检查：
- **未签名/未公证**：用户打开时提示"无法打开，因为无法验证开发者"，需要去系统设置手动放行——对分发是灾难性的
- **签名**：证明应用来自你（Developer ID 证书），且内容未被篡改
- **公证（Notarization）**：把应用提交给 Apple 服务器扫描（恶意软件检查），通过后 Apple 签发票据，Gatekeeper 在线/离线都能验证

### 2. 完整流程

```
1. Apple Developer 账号申请 "Developer ID Application" 证书（注意：不是 Development 证书）
2. 构建 .app
3. 代码签名（codesign）：
   - 开启 hardened runtime（公证的强制要求）
   - 按依赖顺序签名：先签内部 dylib/framework/helper，最后签外层 .app
4. 打包成 dmg/zip
5. 提交公证（notarytool）→ Apple 扫描（几分钟到几十分钟）
6. 装订票据（stapler）：把公证票据钉进 dmg/app，离线也能验证
```

electron-builder 的自动化配置：

```json
// package.json build 配置
{
  "mac": {
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist",
    "notarize": true
  },
  "afterSign": "build/notarize.js"
}
```

```js
// build/notarize.js —— 使用 @electron/notarize
const { notarize } = require('@electron/notarize');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  await notarize({
    appPath: `${context.appOutDir}/${context.packager.appInfo.productFilename}.app`,
    // Apple ID + 专用密码方式（也可用 App Store Connect API Key）
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

### 3. entitlements 的作用

hardened runtime 默认禁用大量能力，需要通过 entitlements 文件按需放行：

```xml
<!-- entitlements.mac.plist -->
<dict>
  <!-- Electron JIT 必需 -->
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <!-- 加载第三方动态库（原生模块）需要 -->
  <key>com.apple.security.cs.disable-library-validation</key><true/>
</dict>
```

### 4. 常见失败原因（真实踩坑高频区）

| 失败现象 | 原因 |
|---------|------|
| 公证被拒：binary not signed | 有文件未签名：asar 外的 dylib、第三方二进制、helper 工具 |
| 公证被拒：hardened runtime not enabled | 签名时没开 hardenedRuntime |
| 公证被拒：timestamp 缺失 | 签名时没带 secure timestamp（网络问题导致时间戳服务器没响应） |
| 签名后应用闪退 | entitlements 缺失：JIT 相关没开；或 library-validation 拦住了未按团队证书签名的 dylib |
| 公证卡住/失败 | 网络问题；用 `xcrun notarytool log <submission-id>` 查详细原因 |
| 自动更新后无法启动 | 更新包的签名证书与旧版本不一致（Squirrel 校验失败） |

### 5. 验证手段

```bash
# 检查签名
codesign -dv --verbose=4 /path/to/MyApp.app
codesign --verify --deep --strict /path/to/MyApp.app

# 检查公证票据
spctl -a -vv /path/to/MyApp.app        # 显示 "accepted source=Notarized Developer ID"
stapler validate /path/to/MyApp.app

# 公证历史与日志
xcrun notarytool history --apple-id xxx --password xxx --team-id xxx
xcrun notarytool log <id> ...
```

### 6. CI/CD 实践

- 证书存 CI 密钥库（如 GitHub Actions secrets 的 p12 base64），构建时导入临时 keychain
- 专用密码（app-specific password）或 App Store Connect API Key 存 secret
- 公证有网络依赖且耗时，CI 要设合理超时与重试

## 面试话术

> 流程一句话：Developer ID 证书 + hardened runtime 签名（先内后外）→ notarytool 提交公证 → stapler 装订。三大经典失败：内部二进制漏签名、entitlements 不配 JIT/库校验放行、签名时间戳缺失。另外强调：macOS 自动更新要求新旧版本同证书签名，换证等于断掉老用户更新通道。

## 常见追问

- **开发调试包需要公证吗？** 不需要，本机开发不触发 Gatekeeper；只有分发给用户的包需要。
- **企业内分发能跳过公证吗？** 可以走 MDM 或让用户手动放行，但体验差，正规做法还是公证。
