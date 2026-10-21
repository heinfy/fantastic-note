# electron-updater 的完整更新流程？macOS 与 Windows 的差异？

## 考察点

- 更新流程的完整链路
- 两大平台更新机制的本质差异

## 参考答案

### 1. 完整更新链路

```
打包产物 + latest.yml 元数据
        ↓ 发布到更新服务器（OSS/CDN/自建）
应用启动 → 请求 latest.yml 比对版本
        ↓ 有新版本
下载更新包（支持差量）→ sha512 校验
        ↓
提示用户 / 静默安装 → quitAndInstall() → 重启完成更新
```

`latest.yml`（Windows）/ `latest-mac.yml`（macOS）是核心元数据，包含版本号、文件名、**sha512 哈希**、发布日期。electron-builder 打包时自动生成，与安装包一同上传。

### 2. 代码实现

```js
const { autoUpdater } = require('electron-updater');

function setupAutoUpdater() {
  autoUpdater.autoDownload = false; // 手动控制下载时机（agent 常静默下载）
  autoUpdater.logger = logger;

  autoUpdater.on('checking-for-update', () => logger.info('检查更新中'));
  
  autoUpdater.on('update-available', (info) => {
    logger.info(`发现新版本 ${info.version}`);
    autoUpdater.downloadUpdate(); // 静默下载，或先询问用户
  });
  
  autoUpdater.on('update-not-available', () => logger.info('已是最新'));
  
  autoUpdater.on('download-progress', (p) => {
    // 节流后推送给 UI 显示进度
    mainWindow?.webContents.send('update:progress', p.percent);
  });
  
  autoUpdater.on('update-downloaded', () => {
    // 弹窗询问用户"立即重启更新"
    dialog.showMessageBox({
      type: 'info',
      message: '新版本已就绪，是否立即重启更新？',
      buttons: ['立即重启', '稍后'],
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });
  
  autoUpdater.on('error', (err) => {
    logger.error('更新失败:', err); // 必须处理，否则未捕获异常
  });

  autoUpdater.checkForUpdates();
}
```

### 3. macOS 与 Windows 的本质差异

| | Windows (nsis) | macOS |
|---|---|---|
| 更新方式 | 下载新安装包，退出后运行安装程序覆盖安装 | 下载 zip，**替换整个 .app** |
| 差量更新 | 支持（block map） | **不支持官方差量**，全量 zip |
| 签名要求 | 建议签名（SmartScreen） | **必须签名**，替换后签名校验失败则更新失败 |
| 安装时机 | quitAndInstall 后运行 nsis 安装器 | quitAndInstall 由 Squirrel.Mac 完成替换 |

**macOS 必须注意的坑**：
- 更新服务器上的 zip 必须和当前运行版本**用同一个证书签名**，否则 Squirrel 拒绝更新
- 证书过期/换证书 → 老版本永远无法自动更新到新签名的包，需要引导用户手动下载（这是真实事故高发点）
- `electron-updater` 的 macOS 更新依赖内置的 Squirrel.Mac

### 4. 工程实践

**（1）定时检查 + 事件触发**
```js
// 启动检查一次，之后每 4 小时
autoUpdater.checkForUpdates();
setInterval(() => autoUpdater.checkForUpdates(), 4 * 3600 * 1000);
// 系统唤醒时也检查一次（休眠期间可能发布新版本）
powerMonitor.on('resume', () => autoUpdater.checkForUpdates());
```

**（2）静默更新 vs 交互更新**
- agent 类应用倾向静默：自动下载，下载完弹一次提示，用户 N 天不重启可在下次自然重启时生效
- 关键安全更新可强制（见「灰度发布与强制更新策略」）

**（3）更新服务器选型**
- 通用：OSS/S3 + CDN，latest.yml 放固定 URL
- 私有/企业：自建接口返回 latest.yml 内容（`autoUpdater.setFeedURL`），可按用户分组下发不同版本——这是灰度的基础
- 现成平台：electron-update-server、Hazel（开源）、官方推荐 update.electronjs.org（限 GitHub 开源项目）

**（4）error 事件必须监听**，否则网络异常会变成未捕获错误。

### 5. 常见坑清单

1. 开发环境测试更新要打"假正式包"（`electron-builder --publish never` + 本地起服务），dev 模式 autoUpdater 不工作
2. `latest.yml` 的 CDN 缓存：发布后旧文件被缓存导致用户拿不到新版本，发布后要刷新 CDN 或给 yml 加缓存短 TTL
3. 降级（回滚）默认不被允许（版本号比较），回滚需要特殊处理
4. Windows 安装中用户运行着应用 → nsis 会强制关进程，确保 quitAndInstall 前数据已保存

## 面试话术

> 流程主线：latest.yml 比对 → 下载 → sha512 校验 → quitAndInstall。平台差异的核心是：Windows 走 nsis 覆盖安装支持差量；macOS 是 Squirrel 整体替换 .app 且强制签名一致——换签名证书等于放弃老用户自动更新。工程上要处理 CDN 缓存、定时+唤醒双触发、error 兜底。

## 常见追问

- **Linux 自动更新？** AppImage 格式 electron-updater 支持；deb/rpm 没有自动更新能力，靠系统包管理器。
- **怎么测试更新流程？** 本地起静态服务放旧版 yml 和新版包，装旧版包改 yml 触发更新。
