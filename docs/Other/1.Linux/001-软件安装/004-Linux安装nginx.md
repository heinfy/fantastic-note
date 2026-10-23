# Linux 安装与配置 Nginx

## 基本概念

### Nginx 是什么

Nginx（engine x）是一个高性能的 HTTP 和反向代理 Web 服务器，同时也提供 IMAP/POP3/SMTP 服务。

Nginx 专门为性能优化而开发，性能是其最重要的考量，实际上非常注重效率，能经受高负载的考验，有报告表明能支持高达 50000 个并发连接数。

### 反向代理

**正向代理**：在客户端配置代理服务器，通过代理服务器进行互联网访问。如果把局域网外的 Internet 想象成一个巨大的资源库，则局域网中的客户端要访问 Internet，需要通过代理服务器来访问，这种代理服务就称为正向代理。

**反向代理**：客户端对代理是无感知的，不需要任何配置就可以访问。我们只需要将请求发送到反向代理服务器，由反向代理服务器去选择目标服务器，获取数据后再返回给客户端。此时反向代理服务器和目标服务器对外就是一个服务器，暴露的是代理服务器地址，隐藏了真实服务器的 IP 地址。

### 负载均衡

单个服务器解决不了时，增加服务器的数量，然后将请求分发到各个服务器上，将原来集中到单个服务器上的负载分发到不同的服务器，这就是负载均衡。

### 动静分离

为了加快网站的解析速度，可以把动态网页和静态页面由不同的服务器来解析，加快解析速度，降低单个服务器的压力。

## 安装

```bash
# 更新系统
yum update

# 安装 EPEL 仓库
yum install epel-release

# 安装 Nginx
yum install nginx

# 启动 Nginx
systemctl start nginx

# 设置 Nginx 开机自启
systemctl enable nginx
```

## 常用命令

```bash
# 查看 Nginx 运行状态（含是否正在运行、是否已启用开机启动）
systemctl status nginx

# 重启 Nginx
systemctl restart nginx

# 仅查看 Nginx 是否正在运行
systemctl is-active nginx
ps -ef | grep nginx   # 查看服务是否启动成功

# 检查 Nginx 是否已启用开机启动
systemctl is-enabled nginx

# 查看 Nginx 的进程
ps aux | grep nginx
```

### 卸载

```bash
# 停止 Nginx 服务（可选）
systemctl stop nginx

# 卸载 Nginx
yum remove nginx

# 清理不再需要的依赖（可选）
yum autoremove
```

## 配置文件

### 配置文件路径

`/usr/local/nginx/nginx.conf`

### 配置文件组成

Nginx 配置文件由 3 部分组成：

**1. 全局块**：从配置文件开始到 events 块之间的内容，主要设置影响 Nginx 服务器整体运行的配置指令，包括运行 Nginx 服务器的用户（组）、允许生成的 worker process 数、PID 存放路径、日志存放路径和类型以及配置文件的引入等。

```bash
# 比如第一行配置：
worker_processes  1;  # 工作进程数目。根据硬件调整，通常等于 CPU 数量或 2 倍 CPU 数量
# 这是 Nginx 服务器并发处理服务的关键配置。worker_processes 值越大，可以支持的并发处理量也越多，但会受到硬件、软件等设备的制约
```

**2. events 块**：涉及的指令主要影响 Nginx 服务器与用户的网络连接。常用的设置包括是否开启对多个 worker process 下的网络连接进行序列化、是否允许同时接收多个网络连接、选取哪种事件驱动模型来处理连接请求、每个 worker process 可以同时支持的最大连接数等。

```bash
events {
    worker_connections  1024;  # 工作进程的最大连接数量
}
```

**3. http 块**：这是 Nginx 服务器配置最频繁的部分，代理、缓存和日志定义等绝大多数功能和第三方模块的配置都在这里。http 块可以包括 http 全局块和 server 块：

- **http 全局块**：配置的指令包括文件引入、MIME-TYPE 定义、日志自定义、连接超时时间、单链接请求数上限等。
- **server 块**：与虚拟主机有密切关系。每个 HTTP 块可以包括多个 server 块，每个 server 块相当于一个虚拟主机，从用户角度看和一台独立的硬件主机完全一样。server 块分为全局 server 块和多个 location 块。

**全局 server 块**：最常见的配置是本虚拟主机的监听配置和名称或 IP 配置。

**location 块**：一个 server 块可以配置多个 location 块，主要作用是基于 Nginx 服务器接收到的请求字符串（例如 `server_name`、`/uri-string`），对虚拟主机名称之外的字符串进行匹配，对特定请求进行处理，实现地址定向、数据缓存和应答控制等功能，许多第三方模块的配置也在这里。

```bash
http {
    include       mime.types;  # 指定 mime 类型，由 mime.type 定义
    default_type  application/octet-stream;

    # 日志格式设置
    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;  # 用 log_format 指令设置日志格式后，需要用 access_log 来指定日志文件存放路径

    sendfile        on;  # 指定 nginx 是否调用 sendfile 函数来输出文件，对于普通应用必须设置 on；如果用来进行下载等磁盘 IO 重负载应用，可设置为 off，以平衡磁盘与网络 IO 处理速度，降低系统 uptime
    #tcp_nopush     on;  # 此选项允许或禁止使用 socket 的 TCP_CORK 选项，仅在 sendfile 的时候使用

    #keepalive_timeout  0;  # keepalive 超时时间
    keepalive_timeout  65;

    #gzip  on;  # 开启 gzip 压缩服务

    # 虚拟主机
    server {
        listen       80;   # 配置监听端口号
        server_name  localhost;  # 配置访问域名，域名可以有多个，用空格隔开

        #charset koi8-r;  # 字符集设置

        #access_log  logs/host.access.log  main;

        location / {
            root   html;
            index  index.html index.htm;
        }

        # 错误跳转页
        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

        # proxy the PHP scripts to Apache listening on 127.0.0.1:80
        #
        #location ~ \.php$ {
        #    proxy_pass   http://127.0.0.1;
        #}

        # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        #location ~ \.php$ {  # 请求的 url 过滤，正则匹配，~ 为区分大小写，~* 为不区分大小写
        #    root           html;  # 根目录
        #    fastcgi_pass   127.0.0.1:9000;  # 请求转向定义的服务器列表
        #    fastcgi_index  index.php;  # 如果请求的 fastcgi_index URI 是以 / 结束的，该指令设置的文件会被附加到 URI 的后面并保存在变量 $fastcgi_script_name 中
        #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
        #    include        fastcgi_params;
        #}

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        #
        #location ~ /\.ht {
        #    deny  all;
        #}
    }
}
```

## 配置实例：反向代理

### 实例一：单服务反向代理

1. 实现效果：在浏览器访问目标地址时打开指定页面；
2. 准备工作：在 Linux 系统启动一个 express 服务器；
3. 配置反向代理：

```bash
server {
    listen       80;   # 配置监听端口号
    server_name  www.123.com 192.168.17.129;  # 配置访问域名，域名可以有多个，用空格隔开
    location / {
        root   html;
        proxy_pass http://127.0.0.1:8080;
        index  index.html index.htm;
    }
}
```

### 实例二：根据路径转发到不同端口

使用 Nginx 反向代理，根据访问的路径跳转到不同的端口服务中，Nginx 监听端口为 9001：

- 访问 `http://127.0.0.1:9001/edu` 直接跳转到 `http://127.0.0.1:8080`；
- 访问 `http://127.0.0.1:9001/vod` 直接跳转到 `http://127.0.0.1:8081`。

准备工作：准备 2 个服务器，创建 edu 和 vod 文件夹及对应页面，并开放端口。

```bash
server {
    listen       9001;  # 配置监听端口号
    server_name  192.168.17.129;  # 配置访问域名，域名可以有多个，用空格隔开
    location ~ /edu/ {
        proxy_pass http://127.0.0.1:8080;
        index  index.html index.htm;
    }
    location ~ /vod/ {
        proxy_pass http://127.0.0.1:8081;
        index  index.html index.htm;
    }
}
```

### location 匹配规则

- `=`：用于不含正则表达式的 uri 前，要求请求字符串与 uri 严格匹配，如果匹配成功，就停止继续向下搜索并立即处理请求。
- `~`：表示 uri 包含正则表达式，并且区分大小写。
- `~*`：表示 uri 包含正则表达式，并且不区分大小写。
- `^~`：用于不含正则表达式的 uri 前，要求 Nginx 服务器找到标识 uri 和请求字符串匹配度最高的 location 后，立即使用此 location 处理请求，而不再使用 location 块中的正则 uri 和请求字符串做匹配。

注意：**如果 uri 包含正则表达式，则必须要有 `~` 或者 `~*` 表示。**

## 参考

- [centOS7 安装 nginx 及 nginx 配置](https://blog.csdn.net/qq_37345604/article/details/90034424)
- [视频地址](https://www.bilibili.com/video/BV1zJ411w7SV)
