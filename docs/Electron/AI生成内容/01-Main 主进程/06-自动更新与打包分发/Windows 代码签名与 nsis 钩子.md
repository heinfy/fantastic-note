# Windows 代码签名怎么做？nsis 安装/卸载钩子怎么用？

## 考察点

- 代码签名证书与 SmartScreen 的关系
- nsis 自定义脚本的实战应用

## 参考答案

### 1. Windows 代码签名

**（1）证书类型**

| 类型 | 特点 |
|------|------|
| OV（普通代码签名证书） | 便宜，但有 **SmartScreen 信誉积累期**：新证书签的下载量少的应用会被 SmartScreen 蓝色警告拦截，需要用户量和时间积累信誉 |
| EV（扩展验证证书） | 贵、需硬件 token（或云签名服务），**立即获得 SmartScreen 信誉**，无警告期 |

**（2）electron-builder 配置**

```json
{
  "win": {
    "certificateFile": "cert.p12",
    "certificatePassword": "env:CERT_PASSWORD",
    "signingHashAlgorithms": ["sha256"],
    "rfc3161TimeStampServer": "http://timestamp.digicert.com"
  }
}
```

要点：
- **必须带时间戳**（rfc3161TimeStampServer）：证书过期后签名依然有效，否则证书过期那天所有已发布包的签名都失效
- EV 证书是硬件 token，本地构建需插 token；CI 场景用云签名服务（如 Azure Trusted Signing、DigiCert KeyLocker）
- 不只安装包要签，**卸载程序、内部 exe 都会被签**（electron-builder 自动处理）

### 2. nsis 自定义钩子

electron-builder 的 nsis 配置支持 include 脚本，在标准安装流程上扩展：

```json
{
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "include": "build/installer.nsh"
  }
}
```

**（1）安装钩子：写注册表、注册开机启动、创建服务**

```nsis
; build/installer.nsh
!macro customInstall
  ; 安装完成后执行：注册开机自启（比应用内设置更可靠）
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" \
    "MyAgent" "$INSTDIR\MyAgent.exe --autostart"

  ; 注册 deeplink 协议
  WriteRegStr HKCR "myagent" "URL Protocol" ""
  WriteRegStr HKCR "myagent\shell\open\command" "" \
    '"$INSTDIR\MyAgent.exe" "%1"'
!macroend
```

**（2）卸载钩子：清理残留**

```nsis
!macro customUnInstall
  ; 删除开机启动项
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "MyAgent"

  ; 询问是否删除用户数据（卸载时保留还是清理配置）
  MessageBox MB_YESNO "是否同时删除应用配置和数据？" IDNO skip_clean
    RMDir /r "$APPDATA\MyAgent"
  skip_clean:
!macroend
```

常用宏（electron-builder 提供）：
- `customInstall`：安装完成时
- `customUnInstall`：卸载时
- `customInit` / `customUnInit`：更早的时机

**（3）典型需求清单**

| 需求 | 实现位置 |
|------|---------|
| 注册开机启动 | customInstall 写注册表 Run 键 |
| 注册 URL 协议（deeplink） | customInstall 写 HKCR |
| 安装 VC++ 运行库等依赖 | customInstall 静默执行依赖安装包 |
| 创建/注册 Windows 服务 | customInstall 调 sc.exe 或助手程序 |
| 卸载清理 userData | customUnInstall |
| 卸载时杀掉运行中的进程 | electron-builder 默认处理，特殊进程自定义 |

### 3. oneClick vs assisted 安装

```json
{
  "nsis": {
    "oneClick": true,                              // 一键安装（双击即装，无界面交互）
    "perMachine": false,                           // false=每用户安装（无需管理员），true=全机安装（要 UAC）
    "allowToChangeInstallationDirectory": false    // oneClick 下是否允许选目录
  }
}
```

- **perMachine: false**（默认）：装到用户目录，**不需要管理员权限**——企业管控环境（禁 UAC）也能装，推荐
- **perMachine: true**：装 Program Files，需要管理员，适合要注册系统服务的场景
- agent 要注册 Windows 服务时通常选 perMachine + 安装时提权一次

### 4. 常见坑

1. **安装包被杀软误报**：未签名或信誉不足时高发。签名 + SmartScreen 信誉 + 必要时向杀软厂商提交白名单
2. **自动更新后开机启动失效**：每用户安装路径含版本号时（旧 Squirrel 风格）注册表路径会过期；nsis 固定安装路径无此问题
3. **卸载残留 userData 导致重装后配置错乱**：卸载钩子里给"清理数据"选项
4. **企业批量部署**：nsis 支持静默参数 `/S`，文档里提供给 IT 部门

## 面试话术

> 签名侧的核心决策是 OV 还是 EV（SmartScreen 信誉期），以及时间戳必带。nsis 侧用 include 宏扩展安装/卸载钩子：注册开机启动和 deeplink 协议、清理卸载残留。安装模式上 agent 一般选 perMachine=false 免 UAC，要注册系统服务才上 perMachine 安装期提权。

## 常见追问

- **不签名能分发吗？** 能，但浏览器下载会警告、SmartScreen 拦截、杀软误报率飙升，正式分发必须签名。
- **自动更新包也要签名吗？** 要，nsis 差量包/全量包都会验签，证书要和 electron-builder 配置一致。
