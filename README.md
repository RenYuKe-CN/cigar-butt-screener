# 烟蒂股筛选器 (Cigar Butt Screener)

一个基于格雷厄姆价值投资理念的A股和港股筛选工具，帮助投资者发现低估值的"烟蒂股"投资机会。

![烟蒂股筛选器](screenshot.png)

## 功能特性

### 1. 市场支持
- **A股市场**：覆盖约500只主流股票
- **港股市场**：覆盖约200只主流股票
- 实时行情数据（腾讯财经API）

### 2. 预设筛选模板
- **经典烟蒂股**：PE < 15, PB < 1.5, 股息率 > 3%
- **格雷厄姆式**：PE < 10, PB < 1, 市值 < 1000亿
- **深度价值**：PB < 0.8, 市值 < 500亿
- **高股息防御**：股息率 > 5%, PB < 1, PE < 20

### 3. 自定义策略编辑器
- **简单条件**：PE、PB、股息率、市值等字段筛选
- **计算条件**：支持 PE×PB、PE+PB 等复合计算
- **混合逻辑**：条件之间可自由组合"且"/"或"
- **策略保存**：支持保存和加载自定义策略

### 4. 数据展示
- 实时股价、涨跌幅
- 市盈率(PE)、市净率(PB)
- 总市值、股息率
- 支持CSV导出

### 5. 界面特性
- 响应式设计，支持移动端
- 深色/浅色主题切换
- 数据缓存优化

## 技术栈

- **前端**：HTML5 + Tailwind CSS + Vanilla JavaScript
- **后端**：Python + FastAPI
- **数据源**：腾讯财经API（代理）
- **部署**：支持任意Linux服务器

## 安装部署

### 环境要求
- Python 3.8+
- pip
- 可选：虚拟环境(venv)

### 快速安装

```bash
# 1. 解压项目
cigar-butt-screener.zip
cd cigar-butt-screener

# 2. 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或: venv\Scripts\activate  # Windows

# 3. 安装依赖
pip install -r requirements.txt

# 4. 启动后端服务（端口8000）
python api_server.py

# 5. 启动前端服务（端口8080）
# 新开一个终端窗口
python3 -m http.server 8080

# 6. 访问
# 前端: http://localhost:8080
# API: http://localhost:8000
```

### 生产环境部署

使用 systemd 或 supervisor 保持服务运行：

```bash
# 安装 supervisor
sudo apt-get install supervisor

# 配置后端服务
cat > /etc/supervisor/conf.d/cigar-api.conf << 'EOF'
[program:cigar-api]
directory=/path/to/cigar-butt-screener
command=/path/to/cigar-butt-screener/venv/bin/python api_server.py
autostart=true
autorestart=true
stderr_logfile=/var/log/cigar-api.err.log
stdout_logfile=/var/log/cigar-api.out.log
EOF

# 配置前端服务
cat > /etc/supervisor/conf.d/cigar-web.conf << 'EOF'
[program:cigar-web]
directory=/path/to/cigar-butt-screener
command=python3 -m http.server 8080
autostart=true
autorestart=true
stderr_logfile=/var/log/cigar-web.err.log
stdout_logfile=/var/log/cigar-web.out.log
EOF

sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

### Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 项目结构

```
cigar-butt-screener/
├── api_server.py          # FastAPI后端服务
├── index.html             # 前端主页面
├── requirements.txt       # Python依赖
├── README.md              # 项目说明
├── INSTALL.md             # 安装指南
├── css/
│   └── style.css          # 自定义样式
├── js/
│   ├── api.js             # API接口封装
│   ├── app.js             # 主应用逻辑
│   ├── cache.js           # 数据缓存模块
│   ├── strategy.js        # 策略编辑器
│   ├── templates.js       # 预设模板
│   └── utils.js           # 工具函数
└── images/                # 图片资源
```

## API接口

### 获取市场指数
```
GET /api/market/indices?market=a股
```

### 获取股票列表
```
GET /api/stocks/a-share?page=1&pageSize=50
GET /api/stocks/hk?page=1&pageSize=50
```

### 筛选股票
```
GET /api/stocks/filter?market=a股&pbMax=1&peMax=15&page=1&pageSize=50
```

参数：
- `market`: a股 | 港股
- `peMax`: 最大PE
- `pbMax`: 最大PB
- `dividendYieldMin`: 最小股息率
- `marketCapMax`: 最大市值(亿)
- `page`: 页码
- `pageSize`: 每页数量

## 数据说明

- **市值**：单位亿元
- **股息率**：百分比（如5.2%表示为0.052）
- **换手率**：百分比
- **涨跌幅**：百分比

## 免责声明

本工具仅供学习研究使用，不构成投资建议。股市有风险，投资需谨慎。

## 许可证

MIT License

## 作者

REN YUKE
