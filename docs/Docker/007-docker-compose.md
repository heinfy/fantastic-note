---
sidebar_position: 7
title: Docker Compose
---

## Docker Compose

Compose 是用于定义和运行多容器 Docker 应用程序的工具。通过 Compose，您可以使用 YML 文件来配置应用程序需要的所有服务。然后，使用一个命令，就可以从 YML 文件配置中创建并启动所有服务。

Compose 使用的三个步骤：

- 使用 Dockerfile 定义应用程序的环境。
- 使用 docker-compose.yml 定义构成应用程序的服务，这样它们可以在隔离环境中一起运行。
- 最后，执行 docker-compose up 命令来启动并运行整个应用程序。

docker-compose.yml 的配置案例如下：

```yaml
# yaml 配置实例
# 指定本 yml 依从的 compose 哪个版本制定的。
version: '3'
services:
  web:
    build: .
    ports:
      - '5000:5000'
    volumes:
      - .:/code
      - logvolume01:/var/log
    links:
      - redis
  redis:
    image: redis
volumes:
  logvolume01: {}
```

```bash
# 创建容器
docker-compose up -d
# 查看容器
docker-compose ps -a
```

## YML 配置指令

### version

指定本 yml 依从的 compose 哪个版本制定的。

### build

指定为构建镜像上下文路径：

例如 webapp 服务，指定为从上下文路径 ./dir/Dockerfile 所构建的镜像：

```yaml
version: '3.7'
services:
  webapp:
    build: ./dir
```

或者，作为具有在上下文指定的路径的对象，以及可选的 Dockerfile 和 args：

```yaml
version: '3.7'
services:
  webapp:
    build:
      context: ./dir
      dockerfile: Dockerfile-alternate
      args:
        buildno: 1
      labels:
        - 'com.example.description=Accounting webapp'
        - 'com.example.department=Finance'
        - 'com.example.label-with-empty-value'
      target: prod
```

- context：上下文路径。
- dockerfile：指定构建镜像的 Dockerfile 文件名。
- args：添加构建参数，这是只能在构建过程中访问的环境变量。
- labels：设置构建镜像的标签。
- target：多层构建，可以指定构建哪一层。

### cap_add，cap_drop

添加或删除容器拥有的宿主机的内核功能。

```yaml
cap_add:
  - ALL # 开启全部权限

cap_drop:
  - SYS_PTRACE # 关闭 ptrace权限
```

### 其他命令

[Docker Compose - 菜鸟教程](https://www.runoob.com/docker/docker-compose.html)
