---
sidebar_position: 2
title: Docker 配置
---

## 修改镜像源

### 1. 创建或修改 Docker 配置文件

Docker 的配置文件 `daemon.json` 通常位于 `/etc/docker/` 目录下。如果该文件不存在，需要先创建它。

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://registry.docker-cn.com"
  ]
}
EOF
```

> **说明**：
>
> - 以上配置添加了多个国内常用的镜像源，Docker 会按顺序尝试使用它们。
> - **中科大镜像源**: `https://docker.mirrors.ustc.edu.cn`
> - **Docker 中国官方镜像源**: `https://registry.docker-cn.com` (注意：此源有时可能不稳定)

> **建议**：你可以根据自己的网络环境选择一个或多个。例如，如果你在教育网，中科大源通常非常快。

### 2. 重启 Docker 服务

修改配置后，必须重启 Docker 服务才能使更改生效。

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 3. 验证配置是否生效

使用以下命令查看 Docker 的系统信息，检查镜像源是否已正确配置。

```bash
sudo docker info
```

在输出的信息中，找到 `Registry Mirrors` 这一项，你应该能看到类似以下的内容：

```plain
Registry Mirrors:
  https://mirror.baidubce.com/
  https://registry.docker-cn.com/
  https://hub-mirror.c.163.com/
  https://docker.mirrors.ustc.edu.cn/
```

如果看到这些地址，说明镜像源配置已经成功。

### 4. （可选）测试拉取镜像

可以尝试拉取一个常用的镜像来测试速度是否提升。

```bash
sudo docker pull hello-world
```

如果配置正确，拉取速度应该会比之前快很多。

---

### 注意事项

- **权限**：操作 `/etc/docker/` 目录和重启服务需要 `root` 权限，所以命令前需要加 `sudo`。
- **JSON 格式**：`daemon.json` 是一个 JSON 文件，必须保证格式正确，避免多余的逗号或缺少引号，否则 Docker 可能无法启动。
- **云服务商镜像源**：如果你使用的是阿里云、腾讯云等云服务器，建议使用该云服务商提供的专属镜像加速器，通常速度更快、更稳定。你可以在对应云平台的容器镜像服务控制台找到你的专属加速器地址。
- **Docker 版本**：以上方法适用于较新版本的 Docker（1.10+）。对于非常老的版本，可能需要通过修改启动脚本（如 `/etc/default/docker`）来配置，但这种方法现在已不推荐。

按照以上步骤操作，即可成功修改 Linux 上 Docker 的镜像源。

## 场景一：从远程仓库下载镜像

这是最常见的“下载镜像”操作。

### 命令：`docker pull`

```bash
docker pull 镜像名:标签
```

### 示例

```bash
# 从 Docker Hub 下载 Nginx 最新镜像
docker pull nginx:latest

# 下载特定版本
docker pull ubuntu:22.04

# 从阿里云私有仓库下载
docker pull registry.cn-beijing.aliyuncs.com/your-namespace/your-image:v1.0
```

### 验证是否下载成功

```bash
docker images
```

你会看到刚下载的镜像出现在列表中。

---

## 场景二：服务器“迁移”

即：**导出一个镜像为文件，复制到本机，再导入**。

### 步骤 1：在源服务器上导出镜像为 `.tar` 文件

```bash
docker save 镜像名:标签 -o 镜像名.tar
```

#### 示例：

```bash
docker save myapp:v1.0 -o myapp-v1.0.tar
```

### 步骤 2：将 `.tar` 文件复制到当前服务器（使用 `scp`, `rsync`, `wget` 等）

```bash
# 从当前服务器拉取文件
scp user@源服务器IP:/path/to/myapp-v1.0.tar ./
```

### 步骤 3：在当前服务器导入镜像

```bash
docker load -i myapp-v1.0.tar
```

### 验证

```bash
docker images
```

---

## 场景三：从私有仓库登录并下载镜像

需要先登录：

```bash
docker login registry.yourcompany.com
```

然后：

```bash
docker pull registry.yourcompany.com/project/app:v1.2
```

---

## 场景四：运行的容器保存为镜像

### 步骤 1：将容器保存为镜像

```bash
docker commit 容器ID 新镜像名:标签
```

例如：

```bash
docker commit abc123 myapp-custom:v1
```

### 步骤 2：导出为文件（可选）

```bash
docker save myapp-custom:v1 -o myapp-custom-v1.tar
```

然后你可以把这个 `.tar` 文件发给别人或传到其他服务器。

---

## 场景五：下载镜像用于离线部署

**批量导出多个镜像：**

```bash
# 导出多个镜像到一个 tar 文件
docker save 镜像1:v1 镜像2:v2 ubuntu:22.04 -o all-images.tar

# 在另一台机器导入
docker load -i all-images.tar
```

---

## 常用命令速查

| 目的             | 命令                            |
| ---------------- | ------------------------------- |
| 从网络下载镜像   | `docker pull nginx:latest`      |
| 导出镜像为文件   | `docker save 镜像 -o 文件.tar`  |
| 导入镜像         | `docker load -i 文件.tar`       |
| 将容器保存为镜像 | `docker commit 容器ID 新镜像名` |
| 查看已有镜像     | `docker images`                 |
