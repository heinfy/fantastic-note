---
sidebar_position: 6
title: Docker 卷
---

## 数据卷

**容器的持久化和同步操作，容器间也可以数据共享！**

### 使用数据卷

1. 方式一：直接使用命令来挂载 `-v`**——双向同步**

```shell
docker run -it -v 主机目录地址:容器内目录地址
```

### 查看挂载的数据卷

```shell

[root@VM-0-5-tencentos home]# docker inspect 9c9bd562b916
[
    {
        // ...
        "Mounts": [
            {
                "Type": "bind",
                "Source": "/home",
                "Destination": "/home",
                "Mode": "",
                "RW": true,
                "Propagation": "rprivate"
            }
        ],
        // ...
    }
]
```

### 具名挂载和匿名挂载

#### 匿名挂载

```shell
# 匿名挂载
-v 容器内的路径

[root@VM-0-5-tencentos home]# docker run -d -P -v /etx/nginx --name nginx001 nginx
95f46729caa3e24a7212d61e811de0274e4145b47c6e4cc9e3f9108f6120b044

# 查看所有的 volume 的情况
[root@VM-0-5-tencentos home]# docker volume ls
DRIVER    VOLUME NAME
local     05cf1086f60525ad79793e9fed16a8fe503671869e54b27e122e7ad0762a9c63
local     95f85f88f6561485400c5f1087999c103722ef956eaa1ecc2b055758753526ac

# 这里发现，这就是匿名挂载，我们在 -v 只写了容器内的地址，没有写容器外的地址

# 匿名挂载在主机的具体地址
[root@VM-0-5-tencentos home]# docker inspect inspect 95f85f88f6561485400c5f1087999c103722ef956eaa1ecc2b055758753526ac
[
    {
        "CreatedAt": "2024-08-31T19:59:16+08:00",
        "Driver": "local",
        "Labels": {
            "com.docker.volume.anonymous": ""
        },
        "Mountpoint": "/var/lib/docker/volumes/95f85f88f6561485400c5f1087999c103722ef956eaa1ecc2b055758753526ac/_data",
        "Name": "95f85f88f6561485400c5f1087999c103722ef956eaa1ecc2b055758753526ac",
        "Options": null,
        "Scope": "local"
    }
]
```

#### 具名挂载

```shell
# 匿名挂载
-v 卷名:容器内的路径
[root@VM-0-5-tencentos home]# docker run -d -P -v juming-ng:/etx/nginx --name nginx002 nginx
023c23a104c675c0bce9291f62cd7d933c614c9c405974c54c32fdb9901c94a0

# 查看所有的 volume 的情况
[root@VM-0-5-tencentos home]# docker volume ls
DRIVER    VOLUME NAME
local     05cf1086f60525ad79793e9fed16a8fe503671869e54b27e122e7ad0762a9c63
local     95f85f88f6561485400c5f1087999c103722ef956eaa1ecc2b055758753526ac
local     juming-ng

# 具名挂载在主机的具体地址
[root@VM-0-5-tencentos home]# docker inspect inspect juming-ng
[
    {
        "CreatedAt": "2024-08-31T20:06:37+08:00",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/juming-ng/_data",
        "Name": "juming-ng",
        "Options": null,
        "Scope": "local"
    }
]
```

#### 拓展

```shell
# ro --- readonly 只读
# rw --- readwrite 可读可写
docker run -d -P -v juming-ng:/etx/nginx:ro --name nginx003 nginx
docker run -d -P -v juming-ng:/etx/nginx:rw --name nginx004 nginx

# ro 只要看到ro就说明这个路径只能通过主机来操作，容器内无法操作！
```

## 数据卷容器

**俩个或者多个容器之间实现数据共享**

### 启动 docker001

```shell
# 构建镜像，内容同上
[root@VM-0-5-tencentos docker-test-volume]# docker build -f Dockerfile001 -t houfei/centos:1.0 .

# 构建并启动容器 docker001
[root@VM-0-5-tencentos docker-test-volume]# docker run -it --name docker001 houfei/centos:1.0
```

### 启动 docker002

```shell
# 启动 docker002
# --volumes-from docker001 ---- docker001 和 docker002 共享文件
[root@VM-0-5-tencentos docker-test-volume]# docker run -it --name docker002 --volumes-from docker001 houfei/centos:1.0
```

### 测试文件共享

```shell
# 在 docker001 容器的 volume01 下创建 fileCreateByDocker001.json 文件
[root@VM-0-5-tencentos docker-test-volume]# docker attach docker001

[root@5e78d40aa940 /]# cd volume01/

[root@5e78d40aa940 volume01]# touch fileCreateByDocker001.json

[root@5e78d40aa940 volume01]# ls
fileCreateByDocker001.json
```

---

```shell
# 在 docker002 容器的 volume01 下查看 fileCreateByDocker001.json 文件
[root@VM-0-5-tencentos docker-test-volume]# docker attach docker002
[root@253dbf711244 /]# cd volume01/
[root@253dbf711244 volume01]# ls
fileCreateByDocker001.json
```

---

**此时，docker001 就是 docker002 的数据卷容器！**

```shell
# 在 docker003 容器的 volume01 下查看 fileCreateByDocker001.json 文件
[root@VM-0-5-tencentos docker-test-volume]#  docker run -it --name docker003 --volumes-from docker001 houfei/centos:1.0
[root@1aee4b1cdd82 /]# cd volume01/
[root@1aee4b1cdd82 volume01]# ls
fileCreateByDocker001.json

# 在 docker002 容器的 volume01 下查看 fileCreateByDocker003.json 文件
[root@VM-0-5-tencentos docker-test-volume]# docker attach 253dbf711244
[root@253dbf711244 volume01]# ls
fileCreateByDocker001.json  fileCreateByDocker003.json
```

**注意，删除 docker001 容器后，docker002 和 docker003 依旧存在数据，说明容器之间共享数据是备份！**

---
