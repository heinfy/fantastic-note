---
sidebar_position: 1
title: Docker 的安装及卸载
---

## 安装 Docker

要在 Rocky Linux（或任何基于 RHEL 的系统，如 CentOS Stream、AlmaLinux）上添加 **Docker 官方存储库**，你可以按照以下步骤操作。这将允许你安装最新版本的 Docker Engine（`docker-ce`），而不是系统自带的旧版本。

---

### ✅ 步骤 1：安装必要的依赖

首先，确保系统已更新，并安装 `dnf` 操作所需的工具：

```bash
sudo dnf repolist # 检查 dnf 源配置
sudo dnf clean all # 清除缓存
sudo dnf makecache

sudo dnf update -y
sudo dnf install -y dnf-plugins-core
```

> `dnf-plugins-core` 包含了 `add-repo` 等关键插件，用于添加第三方仓库。

---

### ✅ 步骤 2：添加 Docker 官方 GPG 密钥和仓库

运行以下命令来添加 Docker 的官方仓库：

```bash
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

> ✅ **注意**：虽然路径中是 `centos`，但它也适用于 Rocky Linux，因为 Rocky 是 RHEL 的下游重建版本，与 CentOS 兼容。

---

### ✅ 步骤 3：（可选）启用 `stable` 仓库（默认已启用）

Docker 仓库通常默认启用 `stable` 版本。你可以确认一下：

```bash
sudo dnf config-manager --set-enabled docker-ce-stable
```

如果你还想安装测试版（不推荐生产环境），可以启用 `edge` 或 `test` 仓库：

```bash
sudo dnf config-manager --set-enabled docker-ce-edge
```

---

### ✅ 步骤 4：安装 Docker Engine

现在你可以从官方仓库安装 Docker：

```bash
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

- `docker-ce`: Docker 社区版引擎
- `docker-ce-cli`: Docker CLI
- `containerd.io`: 容器运行时
- `docker-buildx-plugin`: 构建镜像的插件
- `docker-compose-plugin`: `docker compose` 命令支持

---

### ✅ 步骤 5：启动并启用 Docker 服务

```bash
# 启动 Docker 服务
sudo systemctl start docker

# 设置开机自启
sudo systemctl enable docker
```

---

### ✅ 步骤 6：验证安装

```bash
sudo docker --version
sudo docker run hello-world
```

如果看到输出并成功运行 `hello-world` 容器，说明 Docker 安装成功。

---

### ✅ （可选）将当前用户加入 `docker` 组（避免每次使用 `sudo`）

```bash
sudo usermod -aG docker $USER
```

然后**退出并重新登录**，使组权限生效。之后你就可以直接运行 `docker` 命令而无需 `sudo`。

---

## 更新 Docker

在 Rocky Linux、CentOS、RHEL 等基于 `dnf` 的系统上，更新 Docker 的方法取决于你**最初是如何安装 Docker 的**。

通过 **Docker 官方仓库**安装的：

---

### ✅ 一、检查当前 Docker 版本

```bash
docker --version
```

---

### ✅ 二、更新 Docker 的步骤

#### 1. **更新系统包列表**

确保你的包索引是最新的：

```bash
sudo dnf update -y
```

这会从所有已启用的仓库（包括 Docker 官方仓库）拉取最新的软件包信息。

---

#### 2. **升级 Docker 相关包**

运行以下命令来升级所有已安装的 Docker 组件：

```bash
sudo dnf upgrade -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

> 🔁 如果你不确定是否安装了某个插件，也可以只升级核心组件：
>
> ```bash
> sudo dnf upgrade -y docker-ce docker-ce-cli containerd.io
> ```

---

#### 3. **重启 Docker 服务**

```bash
sudo systemctl restart docker
```

> ✅ 通常不需要禁用或重新启用开机自启，`systemctl enable docker` 的状态会保留。

---

#### 4. **验证更新是否成功**

```bash
docker --version
```

---

### 📌 总结

更新 Docker 的标准流程是：

```bash
# 1. 更新包列表
sudo dnf update -y

# 2. 升级 Docker 组件
sudo dnf upgrade -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 3. 重启服务
sudo systemctl restart docker

# 4. 验证版本
docker --version
```

只要你是通过 **Docker 官方 `dnf` 仓库**安装的，就可以安全地使用 `dnf upgrade` 来获取最新稳定版。

## 卸载 Docker

在 Rocky Linux、CentOS、RHEL 等基于 `dnf` 的系统上，彻底卸载 Docker 需要执行多个步骤，以确保**删除所有相关软件包、依赖项、配置文件和数据**。

---

### 🚫 一、停止并禁用 Docker 服务

```bash
sudo systemctl stop docker
sudo systemctl disable docker
```

- `stop`：停止正在运行的 Docker 服务。
- `disable`：防止系统启动时自动运行 Docker。

---

### 🧹 二、卸载 Docker 软件包

运行以下命令卸载所有与 Docker 相关的软件包：

```bash
sudo dnf remove -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras
```

> 💡 如果你不确定安装了哪些包，可以先查看已安装的 Docker 相关包：
>
> ```bash
> dnf list installed | grep docker
> ```

---

### 🗑️ 三、删除 Docker 数据和配置文件

Docker 的镜像、容器、卷和配置文件**不会自动删除**，需要手动清理：

```bash
# 删除所有 Docker 数据（镜像、容器、卷等）
sudo rm -rf /var/lib/docker

# 删除 Docker 配置文件
sudo rm -rf /etc/docker

# 删除 buildx 缓存（可选）
sudo rm -rf /var/lib/docker-buildx

# 删除 rootless 模式文件（如果使用过）
sudo rm -rf /var/lib/docker-rootless
```

> ⚠️ **警告**：`/var/lib/docker` 包含所有你下载的镜像和创建的容器！删除后无法恢复，请提前备份重要数据。

---

### 🔁 四、（可选）删除 Docker 用户组

如果创建了 `docker` 用户组并添加了用户，可以删除它：

```bash
# 查看 docker 组
getent group docker

# 删除 docker 组（不会影响用户，只是移除组）
sudo groupdel docker
```

> 注意：`groupdel` 不会从系统中删除用户，只是删除组本身。

---

### 🧩 五、（可选）删除 Docker 官方仓库

如果你不再需要从 Docker 官方源安装软件，可以删除仓库文件：

```bash
sudo rm -f /etc/yum.repos.d/docker-ce.repo
```

或者使用 `dnf config-manager` 禁用：

```bash
sudo dnf config-manager --disable docker-ce-stable
```

---

### ✅ 六、验证是否卸载干净

```bash
# 检查是否还有 Docker 包
dnf list installed | grep docker

# 检查 Docker 命令是否存在
which docker

# 检查相关目录是否被删除
ls /var/lib/docker /etc/docker 2>/dev/null || echo "Docker directories removed"
```

如果没有任何输出，说明 Docker 已被彻底卸载。

---

### 📌 总结：一键卸载脚本（建议分步执行）

```bash
# 1. 停止服务
sudo systemctl stop docker
sudo systemctl disable docker

# 2. 卸载包
sudo dnf remove -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 3. 删除数据
sudo rm -rf /var/lib/docker /etc/docker /var/lib/docker-buildx /var/lib/docker-rootless

# 4. （可选）删除仓库
sudo rm -f /etc/yum.repos.d/docker-ce.repo

# 5. （可选）删除用户组
sudo groupdel docker 2>/dev/null || true
```

执行完以上步骤后，Docker 将从你的系统中**完全移除**。

## 常见问题

### `repo`中的源地址重复

```bash
[root@VM-0-5-centos yum.repos.d]# sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
Repository baseos is listed more than once in the configuration
Repository baseos-source is listed more than once in the configuration
Repository appstream is listed more than once in the configuration
Repository appstream-source is listed more than once in the configuration
Repository rt is listed more than once in the configuration
Repository rt-source is listed more than once in the configuration
Repository resilientstorage is listed more than once in the configuration
Repository resilientstorage-source is listed more than once in the configuration
Adding repo from: https://download.docker.com/linux/centos/docker-ce.repo
```

在执行 `dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo` 命令时，你遇到的错误提示表明在 YUM 配置中有重复的仓库条目。

#### 解决方法：

1. **检查重复的仓库配置**

首先，检查系统中是否存在重复的 Docker 仓库配置文件。你可以使用以下命令来查找相关的 `.repo` 文件：

```plain
ls /etc/yum.repos.d/
sudo grep -r "docker-ce-stable" /etc/yum.repos.d/
```

这将列出所有包含 `docker-ce-stable` 的仓库配置文件。你应该检查是否有重复的配置文件或相同仓库被定义多次。

2. **删除重复的仓库配置**

如果你发现多个 `.repo` 文件中定义了相同的仓库，可以选择删除其中的一个，或者在每个文件中删除重复的条目。

检查 `/etc/yum.repos.d/` 目录下的配置文件：

```plain
ls /etc/yum.repos.d/
```

如果你发现重复的 Docker 仓库配置文件（如 `docker-ce.repo`），可以删除其中一个：

```plain
sudo rm /etc/yum.repos.d/docker-ce.repo
```

如果只发现某个文件中重复了仓库条目，你可以手动编辑该文件：

```plain
sudo vi /etc/yum.repos.d/docker-ce.repo
```

确保文件中没有重复的 `[docker-ce-stable]` 或 `[docker-ce-stable-source]` 部分。如果有，删除多余的条目。

3. **清理 YUM 缓存**

删除重复的仓库配置后，执行以下命令清理 YUM 缓存并更新：

```plain
sudo yum clean all
sudo yum makecache
```

4. **检查仓库配置**

你可以用以下命令确认 Docker 的仓库配置是否正确：

```plain
bash


复制代码
sudo yum repolist
```

确保 Docker 仓库只列出一次。

5. **再次尝试更新 Docker**

清理完重复的仓库配置后，尝试再次更新 Docker：

```plain
bash


复制代码
sudo yum update docker-ce docker-ce-cli containerd.io -y
```

#### 总结：

- 检查 `/etc/yum.repos.d/` 下的配置文件，删除重复的仓库条目。
- 清理 YUM 缓存并重新生成。
- 确保 Docker 仓库只列出一次。

### `Warning: Stopping docker.service`

```bash
Warning: Stopping docker.service, but it can still be activated by:
  docker.socket
```

这个警告表示 Docker 服务（`docker.service`）已经被停止，但它仍然可以通过 `docker.socket` 被激活。`docker.socket` 是一种机制，允许 Docker 在需要时通过 socket 激活。这通常发生在 Docker 被配置为通过 Unix 套接字来启动服务，而不是直接启动 `docker.service`。

1. **停止 **`**docker.socket**`** 服务**

如果你不希望 Docker 通过 socket 激活，可以先停止 `docker.socket` 服务：

```plain
sudo systemctl stop docker.socket
```

2. **禁用 **`**docker.socket**`** 服务**

如果你不希望 `docker.socket` 在系统启动时自动启动，可以禁用它：

```plain
sudo systemctl disable docker.socket
```

3. **确保 **`**docker.service**`** 启动**

在停止或禁用 `docker.socket` 后，可以再次启动 `docker.service`：

```plain
sudo systemctl start docker
```

4. **检查服务状态**

查看 Docker 服务的状态，确保它已正常启动：

```plain
sudo systemctl status docker
```

5. **重新启动 Docker**

如果修改完 `docker.socket` 后，想要恢复 Docker 的正常启动，可以重新启动 Docker 服务：

```plain
sudo systemctl restart docker
```

**总结**

- `docker.socket` 是一种用于自动激活 Docker 服务的机制，通常它会在请求到达时启动 Docker 服务。
- 如果你希望手动控制 Docker 服务的启动，停止并禁用 `docker.socket` 可以阻止它自动激活 Docker。
- 启动或重新启动 `docker.service` 来确保 Docker 正常运行。

如果你不想让 Docker 通过 `docker.socket` 自动启动，可以按照上述步骤禁用它。
