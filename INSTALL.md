# 烟蒂股筛选器 - 安装指南

## 系统要求

- **操作系统**: Linux (Ubuntu/CentOS/Debian) 或 macOS
- **Python**: 3.8 或更高版本
- **内存**: 最低 512MB，推荐 1GB+
- **磁盘**: 最低 100MB 可用空间

## 快速安装（5分钟）

### 1. 下载并解压

```bash
# 上传到服务器后解压
unzip cigar-butt-screener.zip
cd cigar-butt-screener
```

### 2. 安装Python依赖

```bash
# 创建虚拟环境（强烈推荐）
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 3. 启动服务

**方式一：手动启动（测试用）**

开两个终端窗口：

```bash
# 终端1：启动后端API（端口8000）
python api_server.py

# 终端2：启动前端（端口8080）
python3 -m http.server 8080
```

**方式二：后台运行（推荐）**

```bash
# 使用 nohup
nohup python api_server.py > api.log 2>&1 &
nohup python3 -m http.server 8080 > web.log 2>&1 &

# 查看进程
ps aux | grep python

# 停止进程
pkill -f api_server.py
pkill -f "http.server 8080"
```

### 4. 访问

```
前端界面: http://你的服务器IP:8080
API接口: http://你的服务器IP:8000
```

---

## 生产环境部署

### 使用 Supervisor（推荐）

```bash
# 1. 安装 supervisor
sudo apt-get update
sudo apt-get install -y supervisor

# 2. 创建后端服务配置
sudo tee /etc/supervisor/conf.d/cigar-api.conf > /dev/null << 'EOF'
[program:cigar-api]
directory=/root/cigar-butt-screener
command=/root/cigar-butt-screener/venv/bin/python api_server.py
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/cigar-api.err.log
stdout_logfile=/var/log/cigar-api.out.log
environment=HOME="/root",USER="root"
EOF

# 3. 创建前端服务配置
sudo tee /etc/supervisor/conf.d/cigar-web.conf > /dev/null << 'EOF'
[program:cigar-web]
directory=/root/cigar-butt-screener
command=python3 -m http.server 8080
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/cigar-web.err.log
stdout_logfile=/var/log/cigar-web.out.log
EOF

# 4. 启动服务
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all

# 5. 查看状态
sudo supervisorctl status

# 6. 常用命令
sudo supervisorctl restart cigar-api    # 重启后端
sudo supervisorctl restart cigar-web    # 重启前端
sudo supervisorctl stop all             # 停止所有
sudo supervisorctl start all            # 启动所有
```

### 使用 Systemd

```bash
# 1. 创建后端服务
sudo tee /etc/systemd/system/cigar-api.service > /dev/null << 'EOF'
[Unit]
Description=Cigar Butt Screener API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/cigar-butt-screener
ExecStart=/root/cigar-butt-screener/venv/bin/python api_server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 2. 创建前端服务
sudo tee /etc/systemd/system/cigar-web.service > /dev/null << 'EOF'
[Unit]
Description=Cigar Butt Screener Web
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/cigar-butt-screener
ExecStart=python3 -m http.server 8080
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 3. 启动服务
sudo systemctl daemon-reload
sudo systemctl enable cigar-api cigar-web
sudo systemctl start cigar-api cigar-web

# 4. 查看状态
sudo systemctl status cigar-api
sudo systemctl status cigar-web
```

### 使用 Nginx 反向代理

```bash
# 1. 安装 Nginx
sudo apt-get install -y nginx

# 2. 配置 Nginx
sudo tee /etc/nginx/sites-available/cigar > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;  # 监听所有域名

    # 前端静态文件
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # API接口
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# 3. 启用配置
sudo ln -sf /etc/nginx/sites-available/cigar /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 4. 访问
# http://你的服务器IP
```

---

## Docker 部署（可选）

### Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install -r requirements.txt

# 复制项目文件
COPY . .

# 暴露端口
EXPOSE 8000 8080

# 启动脚本
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]
```

### start.sh

```bash
#!/bin/bash
# 启动后端
python api_server.py &
# 启动前端
python3 -m http.server 8080 &
# 等待
wait
```

### 构建和运行

```bash
# 构建镜像
docker build -t cigar-butt-screener .

# 运行容器
docker run -d -p 8080:8080 -p 8000:8000 --name cigar cigar-butt-screener

# 查看日志
docker logs -f cigar
```

---

## 防火墙配置

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 8080/tcp
sudo ufw allow 8000/tcp
sudo ufw reload

# CentOS (Firewalld)
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload

# 云服务器安全组
# 需要在控制台开放 8080 和 8000 端口
```

---

## 常见问题

### Q: 启动后无法访问？

```bash
# 检查端口监听
netstat -tlnp | grep -E '8080|8000'

# 检查防火墙
sudo ufw status

# 检查服务日志
tail -f /var/log/cigar-api.out.log
tail -f /var/log/cigar-web.out.log
```

### Q: 如何修改端口？

```bash
# 修改后端端口（编辑 api_server.py）
# 找到最后一行：
# uvicorn.run(app, host="0.0.0.0", port=8000)
# 改为想要的端口

# 修改前端端口
python3 -m http.server 9090  # 改为9090
```

### Q: 如何更新股票列表？

编辑 `api_server.py` 中的 `A_STOCK_CODES` 和 `HK_STOCK_CODES` 列表。

### Q: 数据多久更新？

- 实时数据：每次请求获取最新行情
- 缓存时间：指数30秒，股票列表1分钟
- 股息率：预置数据（可在代码中更新）

---

## 卸载

```bash
# 停止服务
sudo supervisorctl stop all
sudo systemctl stop cigar-api cigar-web

# 删除文件
rm -rf /root/cigar-butt-screener

# 删除配置
sudo rm -f /etc/supervisor/conf.d/cigar-*.conf
sudo rm -f /etc/systemd/system/cigar-*.service
sudo rm -f /etc/nginx/sites-available/cigar
sudo rm -f /etc/nginx/sites-enabled/cigar

# 重启服务
sudo supervisorctl update
sudo systemctl daemon-reload
sudo systemctl restart nginx
```

---

## 技术支持

如有问题，请检查：
1. Python版本是否 >= 3.8
2. 端口是否被占用
3. 防火墙是否放行
4. 日志文件中的错误信息
