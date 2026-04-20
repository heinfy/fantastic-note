---
sidebar_position: 4
title: Docker 常用命令
---

## docker 命令

- [https://docs.docker.com/reference/](https://docs.docker.com/reference/)

### 帮助命令

```shell
docker version # 版本信息
docker info # docker系统信息，包括镜像和容器信息
docker 命令 --help # 帮助命令
```

### 镜像命令

```shell
# 列出镜像
docker images
docker images -a # 列出所有镜像
docker images -q # 列出镜像id

# 搜索mysql镜像
docker search mysql

[root@VM-0-5-tencentos ~]# docker search mysql
NAME                  DESCRIPTION                                     STARS     OFFICIAL
mysql                 MySQL is a widely used, open-source relation…   15326     [OK]
bitnami/mysql         Bitnami container image for MySQL               117
google/mysql          MySQL server for Google Compute Engine          25
elestio/mysql         Mysql, verified and packaged by Elestio         0

# 下载镜像，不写 tag，默认拉去latest
docker pull 镜像名[:tag]

docker pull mysql:5.7

# docker pull mysql 等价于
docker pull docker.io/library/mysql:latest

# 删除镜像
docker rmi -f image-id

# 删除多个镜像
docker rmi -f image-id1 image-id2 image-id3

# 删除全部镜像
docker rmi -f $(docker images -aq)

```

### 容器命令

```shell
# 下载 centos 镜像
docker pull centos

# 新建并启动
docker run [可选参数] iamge

--name="name" # 容器名称
-d # 后台方式运行
-p # 指定容器的端口 -p 8080:8080
  -p ip:主机端口:容器端口
  -p 主机端口:容器端口
  -p 容器端口
  容器端口

-P # 随机指定端口

# 测试：启动并进入容器
docker run -it centos /bin/bash

# 列出所有运行的容器
docker ps -a
-a # all
-n=number # 显示最近的number的容器
-q # 显示容器id

# 退出容器
exit # 容器停止退出

Ctrl + P + Q # 容器不停止退出

[root@VM-0-5-tencentos ~]# docker run -it centos /bin/bash
# Ctrl + P + Q
[root@cfe0899140b6 /]# [root@VM-0-5-tencentos ~]#


# 删除容器
docker rm 容器id
docker rm -f $(docker ps -al) # 删除所有容器
docker ps -a -q|xargs docker rm # 删除所有容器

# 容器的启动停止
docker start 容器id
docker restart 容器id
docker stop 容器id # 停止当前容器
docker kill 容器id # 强制停止当前容器
```

### 其他命令

```shell
#　后台启动容器
docker run -d centos
```

### 查看日志

```shell
docker lofs -tf tail 100 容器 # 没有日志
```

### 查看容器的进程信息

```shell
docker top 容器id
```

### 查看容器的内部信息

```shell
docker inspect 容器id
```

### 进入正在运行的容器

```shell
# 方式1 进入容器开启一个新的终端，可以在里边操作
docker exec -it 容器id bashShell

# 方式2 进入正在运行的容器，正在执行当前代码
docker attach 容器id

```

### 从容器内 copy 文件到主机

```shell
docker cp 容器id:容器内路径 目的主机的路径

# ctrl + q + p 退出容器
```

## 常用命令

```bash
# 移除所有镜像
docker rmi -f $(docker images -qa)

# 强制移除容器
docker rm -f $(docker ps -qa)

# 构建镜像
docker build -f Dockerfile -t IMAGE_NAME:${IMAGE_TAG:-latest}

# 查看镜像
docker images

# 运行容器
docker run -it -p 9090:9090 -p 9091:9091 IMAGE_ID

# 查看所有容器
docker ps -aq

# 登录 dockerhub
docker login URL

# 打 Tag
docker tag IMAGE_NAME:${IMAGE_TAG:-latest} URL/PROJECT_NAME/IMAGE_NAME:${IMAGE_TAG:-latest}

# 将镜像推送到 dockerhub
docker push URL/PROJECT_NAME/IMAGE_NAME:${IMAGE_TAG:-latest}

# 从 dockerhub 拉取镜像
docker pull URL/PROJECT_NAME/IMAGE_NAME:${IMAGE_TAG:-latest}
```
