# Linux 安装 Node.js

以 CentOS / Rocky Linux 为例，通过官方二进制包安装 Node.js，并配置全局命令。

## 下载并解压

```bash
# 安装 wget
yum install -y wget

cd /usr/local/

# 下载压缩包（版本可按需替换）
wget https://nodejs.org/dist/v18.16.1/node-v18.16.1-linux-x64.tar.xz

# 解压
xz -d node-v18.16.1-linux-x64.tar.xz
tar -xf node-v18.16.1-linux-x64.tar

# 重命名目录
mv node-v18.16.1-linux-x64 nodejs
```

## 配置全局命令

创建软链接，使 `node`、`npm`、`npx` 可以在任意路径下使用：

```bash
ln -s /usr/local/nodejs/bin/node /usr/local/bin/node
ln -s /usr/local/nodejs/bin/npm /usr/local/bin/npm
ln -s /usr/local/nodejs/bin/npx /usr/local/bin/npx
```

## 验证安装

```bash
node -v
npm -v
```
