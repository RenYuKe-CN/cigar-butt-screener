# 烟蒂股筛选器 - 快速开始指南

## 5分钟快速部署

### 1. 下载并解压

```bash
# 解压项目
unzip cigar-butt-screener.zip
cd cigar-butt-screener
```

### 2. 安装依赖

```bash
# 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 3. 一键启动

```bash
# 启动服务（前端8080端口 + 后端8000端口）
./start.sh

# 或使用完整命令
./start.sh start    # 启动
./start.sh stop     # 停止
./start.sh restart  # 重启
./start.sh status   # 查看状态
```

### 4. 访问

- **前端界面**: http://你的服务器IP:8080
- **API接口**: http://你的服务器IP:8000

---

## 生产环境部署（推荐）

使用 Supervisor 保持服务持续运行：

```bash
# 安装 supervisor
sudo apt-get update && sudo apt-get install -y supervisor

# 复制配置
sudo cp deploy/supervisor/cigar-api.conf /etc/supervisor/conf.d/
sudo cp deploy/supervisor/cigar-web.conf /etc/supervisor/conf.d/

# 更新配置并启动
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all

# 查看状态
sudo supervisorctl status
```

---

## 目录结构

```
cigar-butt-screener/
├── api_server.py          # FastAPI后端
├── index.html             # 前端页面
├── start.sh               # 一键启动脚本 ⭐
├── requirements.txt       # Python依赖
├── README.md              # 项目说明
├── INSTALL.md             # 详细安装指南
├── QUICKSTART.md          # 本文件
├── deploy/                # 部署配置
│   ├── supervisor/        # Supervisor配置
│   ├── systemd/           # Systemd配置
│   └── nginx/             # Nginx配置
├── css/                   # 样式文件
├── js/                    # JavaScript文件
└── logs/                  # 日志目录
```

---

## 常用命令

```bash
# 查看日志
tail -f logs/api.log
tail -f logs/web.log

# 检查端口
netstat -tlnp | grep -E '8080|8000'

# 防火墙放行（如需要）
sudo ufw allow 8080/tcp
sudo ufw allow 8000/tcp
```

---

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| 端口被占用 | `lsof -i :8080` 查看占用进程，或修改端口 |
| 依赖安装失败 | 确保 Python >= 3.8，`pip install --upgrade pip` |
| 无法访问 | 检查防火墙/安全组是否放行 8080 和 8000 端口 |

---

## 技术支持

详细文档请参考：
- `README.md` - 项目完整说明
- `INSTALL.md` - 详细安装部署指南
