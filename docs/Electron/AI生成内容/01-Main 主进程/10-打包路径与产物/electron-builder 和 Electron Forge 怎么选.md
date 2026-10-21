# electron-builder 和 Electron Forge 怎么选？

## 考察点

- 两条官方主流打包链的分工
- 和自动更新、签名的衔接

## 参考答案

### 1. 差别

| | electron-builder | Electron Forge |
|---|---|---|
| 定位 | 打包和分发配置很全 | 官方维护的一条龙工具链（脚手架、开发、打包、发布） |
| 安装包 | dmg、nsis、msi、AppImage、snap 等直接配置 | 通过 Maker 插件生成对应格式 |
| 自动更新 | 配套 `electron-updater`，社区资料多 | 可用 `update-electron-app` 或自己接 publisher |
| 开发体验 | 不管你怎么打包前端，自己配脚本 | 官方 Vite / Webpack 插件，入口约定多 |
| 国内项目 | agent、企业内部应用里非常常见 | 新项目、跟官方示例走的团队更多 |

两者都能签 macOS、做 Windows nsis。差别主要是“谁来组织工程”，不是“谁能打出安装包”。

### 2. 怎么选

- 已经有自己的 Vite/Webpack 配置，只要稳定的 dmg/nsis 和 electron-updater：继续 **electron-builder**
- 从零开始、希望官方插件管开发服务器和打包：用 **Forge**
- 团队里没人熟悉 Forge 的 Maker/Publisher 时，不要为了“更官方”在存量项目上迁移。迁移的风险在签名、更新地址和安装钩子，不在业务代码

### 3. 和面试答案相关的点

无论哪条链，都要能讲清：

- 产物是 asar + 可执行文件外壳
- macOS 要签名和公证，Windows 要代码签名和时间戳
- 更新元数据（`latest.yml` / `latest-mac.yml`）和安装包放一起
- 原生模块在打包机上 `electron-rebuild`，并且 `.node` 要 unpack

不要把“打包工具”说成安全方案。builder 和 Forge 都不会把源码加密。

## 面试话术

> 存量项目和要强控制 nsis/dmg 的，我用 electron-builder 加 electron-updater。新项目想要官方把开发和打包串起来，用 Forge。选择标准是团队是否已经把签名、公证、更新地址跑通，而不是哪个名字更新。两条链都解决不了源码加密。

## 常见追问

- **electron-packager 呢？** 它只把应用打成可执行目录，安装包、签名、更新还要自己接。现在通常作为 Forge 的底层，而不是业务项目直接用。
- **能不能混用？** 不建议。一套项目只留一条打包入口，否则 CI 会出现两套签名配置。
