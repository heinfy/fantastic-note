# 差量更新与 blockmap

差量更新指升级时只下载安装包里发生变化的部分。electron-builder 在打 Windows 安装包时可以生成 `.blockmap` 文件。

blockmap 把安装包切成固定大小的块，并为每块记录哈希。更新时客户端：

1. 下载体积很小的新 blockmap。
2. 计算本机旧安装包各块的哈希。
3. 用 HTTP Range 只请求哈希不同的块。
4. 在本地拼出新安装包，再用 `latest.yml` 里的 sha512 核对整包。

服务端仍然存放完整安装包，不必为每一对旧版本和新版本做差分文件。块对不上或 blockmap 下载失败时，更新器改为下载完整包。

macOS 上常见的 Squirrel 更新是替换整个 `.app` 或 zip，官方这条链路不使用 blockmap。只改业务代码、几乎不改 Chromium 时，Windows 差量能少下很多；升级 Electron 大版本时运行时变化大，能复用的块就少。

## 相关文档

- [概念-打包分发与自动更新](./概念-打包分发与自动更新.md)
