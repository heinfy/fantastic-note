---
sidebar_position: 3
title: Dockerfile
---

## 什么是 Dockerfile？

[Dockerfile](https://docs.docker.com/reference/dockerfile/) 是一个文本文件，包含了构建 Docker 镜像的所有指令。

通过定义一系列命令和参数，Dockerfile 指导 Docker 构建一个自定义的镜像。

### 使用 Dockerfile 定制镜像

```dockerfile
FROM nginx
RUN echo '这是一个本地构建的nginx镜像' > /usr/share/nginx/html/index.html
```

**FROM**：定制的镜像都是基于 FROM 的镜像，这里的 nginx 就是定制需要的基础镜像。后续的操作都是基于 nginx。

**RUN**：用于执行后面跟着的命令行命令。有以下俩种格式：

shell 格式：

```dockerfile
RUN <命令行命令>
# <命令行命令> 等同于，在终端操作的 shell 命令。
```

exec 格式：

```dockerfile
RUN ["可执行文件", "参数1", "参数2"]
# 例如：
# RUN ["./test.php", "dev", "offline"] 等价于 RUN ./test.php dev offline
```

**注意**：Dockerfile 的指令每执行一次都会在 docker 上新建一层。所以过多无意义的层，会造成镜像膨胀过大。例如：

例如：

```dockerfile
FROM centos
RUN yum -y install wget
RUN wget -O redis.tar.gz "http://download.redis.io/releases/redis-5.0.3.tar.gz"
RUN tar -xvf redis.tar.gz
```

以上执行会创建 3 层镜像。可简化为以下格式：

```dockerfile
FROM centos
RUN yum -y install wget \
 && wget -O redis.tar.gz "http://download.redis.io/releases/redis-5.0.3.tar.gz" \
 && tar -xvf redis.tar.gz
```

如上，以**&&**符号连接命令，这样执行后，只会创建 1 层镜像。

### 构建镜像

在 Dockerfile 文件的存放目录下，执行构建动作。

```bash
$ docker build -t nginx:v3 .
```

### 上下文路径

上下文路径，是指 docker 在构建镜像，有时候想要使用到本机的文件（比如复制），docker build 命令得知这个路径后，会将路径下的所有内容打包。  
解析：由于 docker 的运行模式是 C/S。我们本机是 C，docker 引擎是 S。实际的构建过程是在 docker 引擎下完成的，所以这个时候无法用到我们本机的文件。这就需要把我们本机的指定目录下的文件一起打包提供给 docker 引擎使用。

如果未说明最后一个参数，那么默认上下文路径就是 Dockerfile 所在的位置。

注意：上下文路径下不要放无用的文件，因为会一起打包发送给 docker 引擎，如果文件过多会造成过程缓慢。

## 常见指令

| Dockerfile 指令 | 说明                                                                 |
| --------------- | -------------------------------------------------------------------- |
| FROM            | 指定基础镜像，用于后续的指令构建。                                   |
| LABEL           | 添加镜像的元数据，使用键值对的形式。                                 |
| RUN             | 在构建过程中在镜像中执行命令。                                       |
| CMD             | 指定容器创建时的默认命令。（可以被覆盖）                             |
| ENTRYPOINT      | 设置容器创建时的主要命令。（不可被覆盖）                             |
| EXPOSE          | 声明容器运行时监听的特定网络端口。                                   |
| ENV             | 在容器内部设置环境变量。                                             |
| ADD             | 将文件、目录或远程 URL 复制到镜像中。                                |
| COPY            | 将文件或目录复制到镜像中。                                           |
| VOLUME          | 为容器创建挂载点或声明卷。                                           |
| WORKDIR         | 设置后续指令的工作目录。                                             |
| USER            | 指定后续指令的用户上下文。                                           |
| ARG             | 定义在构建过程中传递给构建器的变量，可使用 "docker build" 命令设置。 |
| ONBUILD         | 当该镜像被用作另一个构建过程的基础时，添加触发器。                   |
| STOPSIGNAL      | 设置发送给容器以退出的系统调用信号。                                 |
| HEALTHCHECK     | 定义周期性检查容器健康状态的命令。                                   |
| SHELL           | 覆盖 Docker 中默认的 shell，用于 RUN、CMD 和 ENTRYPOINT 指令。       |

### COPY

```dockerfile
COPY 源文件 目标文件

# [--from=<image|stage|context>]
COPY --from=nginx:latest /etc/nginx/nginx.conf /nginx.conf
COPY --form=builder 源文件 目标文件
```

### CMD

Dockerfile 中只能有一条 `CMD` 指令。如果您列出多个 CMD，则只有最后一个 `CMD` 生效。

- `CMD [“param1”，“param2”]` （exec 表单，作为 `ENTRYPOINT` 的默认参数）
- `CMD 命令 param1 param2`（shell 形式）

### ENTRYPOINT

- `ENTRYPOINT ["executable", "param1", "param2"]`exec 表单形式
- `ENTRYPOINT command param1 param2` shell 形式

`docker run <image>` 的命令行参数将附加在 exec 表单 `ENTRYPOINT` 中的所有元素之后，并将覆盖使用 `CMD` 指定的所有元素。

只有 Dockerfile 中的最后一个 `ENTRYPOINT` 指令才会生效。

### ENV

设置环境变量，定义了环境变量，那么在后续的指令中，就可以使用这个环境变量。

`ENV <key>=<value> ...`

```dockerfile
ENV MY_NAME="John Doe"
ENV MY_DOG=Rex\ The\ Dog
ENV MY_CAT=fluffy

# 一次设置多个
ENV MY_NAME="John Doe" MY_DOG=Rex\ The\ Dog \
    MY_CAT=fluffy
```

当从生成的映像运行容器时，使用 `ENV` 设置的环境变量将保留。您可以使用 `docker inspect` 查看值，并使用 `docker run --env <key>=<value>` 改变他们.

阶段将继承其父阶段或任何祖先使用 `ENV` 设置的任何环境变量。

如果仅在构建期间需要环境变量，而在最终映像中不需要，请考虑为单个命令设置一个值：

```dockerfile
RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y ...
```

或者使用 [ARG](https://docs.docker.com/reference/dockerfile/#arg)，它不会保留在最终镜像中：

```dockerfile
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y ...
```

### ARG

构建参数，与 ENV 作用一致。不过作用域不一样。ARG 设置的环境变量仅对 Dockerfile 内有效，也就是说只有 docker build 的过程中有效，构建好的镜像内不存在此环境变量。

构建命令 `docker build 中可以用 --build-arg <参数名>=<值>` 来覆盖。

格式：

```dockerfile
ARG <name>[=<default value>]

ARG user1
ARG buildno

# ARG 指令可以选择包含默认值：
ARG user1=someuser
ARG buildno=1
```

### ADD

ADD 指令和 COPY 的使用格类似（同样需求下，官方推荐使用 COPY）。功能也类似，不同之处如下：

- ADD 的优点：在执行源文件为 tar 压缩文件的话，压缩格式为 gzip, bzip2 以及 xz 的情况下，会自动复制并解压到目标路径。
- ADD 的缺点：在不解压的前提下，无法复制 tar 压缩文件。会令镜像构建缓存失效，从而可能会令镜像构建变得比较缓慢。具体是否使用，可以根据是否需要自动解压来决定。

### LABEL

LABEL 指令用来给镜像添加一些元数据（metadata），以键值对的形式，语法格式如下：

```dockerfile
LABEL <key>=<value> <key>=<value> <key>=<value> ...
```

比如我们可以添加镜像的作者：

```dockerfile
LABEL org.opencontainers.image.authors="runoob"

# 指定多个标签
LABEL multi.label1="value1" multi.label2="value2" other="value3"

# 或者：
LABEL multi.label1="value1" \
      multi.label2="value2" \
      other="value3"
```

## ARG 和 ENV 对比

`ENV` 和 `ARG` 指令的主要区别在于：

1. **作用域**：
   - `ENV`：在构建时和运行时都可用，定义的环境变量在容器运行时可用。
   - `ARG`：仅在构建时有效，定义的变量在容器运行时不可用。
2. **使用场景**：
   - `ENV`：用于设置容器运行时所需的环境变量。
   - `ARG`：用于在构建镜像时传递参数，适合用于条件构建或配置。
3. **持久性**：
   - `ENV`：会被保留在最终镜像中。
   - `ARG`：不会被保留在最终镜像中，只在构建过程中使用。

`ARG` 只在定义它的 `FROM` 指令中有效，而 `ENV` 会在每个 `FROM` 后生效，适用于整个镜像。每个阶段的 `ARG` 需要在对应的阶段显式定义。

`docker build ... --build-arg A=测试` 只会覆盖当前阶段的 `ARG`，对于每个 `FROM` 指令，需要在对应的阶段显式使用相同的 `ARG` 名称来覆盖。
