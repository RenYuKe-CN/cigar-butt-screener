#!/bin/bash
# 烟蒂股筛选器 - 一键启动脚本
# 用法: ./start.sh [命令]
# 命令: start(默认) | stop | restart | status

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_LOG="$PROJECT_DIR/logs/api.log"
WEB_LOG="$PROJECT_DIR/logs/web.log"
PID_FILE="$PROJECT_DIR/.pids"

# 端口
API_PORT=8000
WEB_PORT=8080

# 确保日志目录存在
mkdir -p "$PROJECT_DIR/logs"

# 检查虚拟环境
check_venv() {
    if [ -d "$PROJECT_DIR/venv" ]; then
        source "$PROJECT_DIR/venv/bin/activate"
        echo -e "${GREEN}✓ 已激活虚拟环境${NC}"
    else
        echo -e "${YELLOW}⚠ 未找到虚拟环境，使用系统Python${NC}"
    fi
}

# 检查端口占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 获取占用端口的PID
get_pid_by_port() {
    local port=$1
    lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null | head -1
}

# 启动服务
start_services() {
    echo -e "${BLUE}=== 启动烟蒂股筛选器 ===${NC}"

    check_venv

    # 检查端口是否被占用
    if check_port $API_PORT; then
        echo -e "${YELLOW}⚠ 端口 $API_PORT 已被占用 (PID: $(get_pid_by_port $API_PORT))${NC}"
    else
        # 启动后端API
        echo -e "${BLUE}→ 启动后端API (端口 $API_PORT)...${NC}"
        nohup python "$PROJECT_DIR/api_server.py" > "$API_LOG" 2>&1 &
        API_PID=$!
        echo -e "${GREEN}✓ 后端API已启动 (PID: $API_PID)${NC}"
    fi

    if check_port $WEB_PORT; then
        echo -e "${YELLOW}⚠ 端口 $WEB_PORT 已被占用 (PID: $(get_pid_by_port $WEB_PORT))${NC}"
    else
        # 启动前端服务
        echo -e "${BLUE}→ 启动前端服务 (端口 $WEB_PORT)...${NC}"
        cd "$PROJECT_DIR"
        nohup python3 -m http.server $WEB_PORT > "$WEB_LOG" 2>&1 &
        WEB_PID=$!
        echo -e "${GREEN}✓ 前端服务已启动 (PID: $WEB_PID)${NC}"
    fi

    # 保存PID
    echo "API_PID=$API_PID" > "$PID_FILE"
    echo "WEB_PID=$WEB_PID" >> "$PID_FILE"

    echo ""
    echo -e "${GREEN}=== 服务启动完成 ===${NC}"
    echo -e "前端界面: ${BLUE}http://localhost:$WEB_PORT${NC}"
    echo -e "API接口: ${BLUE}http://localhost:$API_PORT${NC}"
    echo ""
    echo -e "查看日志: ${YELLOW}tail -f logs/api.log logs/web.log${NC}"
}

# 停止服务
stop_services() {
    echo -e "${BLUE}=== 停止烟蒂股筛选器 ===${NC}"

    # 停止后端API
    if check_port $API_PORT; then
        local pid=$(get_pid_by_port $API_PORT)
        echo -e "${YELLOW}→ 停止后端API (PID: $pid)...${NC}"
        kill $pid 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ 后端API已停止${NC}"
    else
        echo -e "${YELLOW}⚠ 后端API未运行${NC}"
    fi

    # 停止前端服务
    if check_port $WEB_PORT; then
        local pid=$(get_pid_by_port $WEB_PORT)
        echo -e "${YELLOW}→ 停止前端服务 (PID: $pid)...${NC}"
        kill $pid 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ 前端服务已停止${NC}"
    else
        echo -e "${YELLOW}⚠ 前端服务未运行${NC}"
    fi

    rm -f "$PID_FILE"
    echo -e "${GREEN}=== 服务已停止 ===${NC}"
}

# 查看状态
show_status() {
    echo -e "${BLUE}=== 服务状态 ===${NC}"

    if check_port $API_PORT; then
        local pid=$(get_pid_by_port $API_PORT)
        echo -e "后端API: ${GREEN}运行中${NC} (端口: $API_PORT, PID: $pid)"
    else
        echo -e "后端API: ${RED}未运行${NC} (端口: $API_PORT)"
    fi

    if check_port $WEB_PORT; then
        local pid=$(get_pid_by_port $WEB_PORT)
        echo -e "前端服务: ${GREEN}运行中${NC} (端口: $WEB_PORT, PID: $pid)"
    else
        echo -e "前端服务: ${RED}未运行${NC} (端口: $WEB_PORT)"
    fi
}

# 主命令处理
case "${1:-start}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        ;;
    status)
        show_status
        ;;
    *)
        echo "用法: $0 [start|stop|restart|status]"
        echo "  start   - 启动服务 (默认)"
        echo "  stop    - 停止服务"
        echo "  restart - 重启服务"
        echo "  status  - 查看状态"
        exit 1
        ;;
esac
