#!/bin/bash

# AI賽馬分析平台 - 部署腳本
# 用法: ./deploy.sh [環境]

set -e

ENVIRONMENT=${1:-development}
PROJECT_NAME="horse-racing-analysis"
FRONTEND_DIR="./frontend"
BACKEND_DIR="./backend"

echo "🚀 開始部署 AI賽馬分析平台 ($ENVIRONMENT 環境)"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 檢查依賴
check_dependencies() {
    echo -e "${BLUE}🔍 檢查系統依賴...${NC}"
    
    local missing_deps=()
    
    # 檢查Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    fi
    
    # 檢查npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    # 檢查Python
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("Python 3")
    fi
    
    # 檢查Docker (可選)
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker未安裝，跳過容器化部署${NC}"
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}❌ 缺少必要依賴: ${missing_deps[*]}${NC}"
        echo "請安裝缺少的依賴後重試"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 所有依賴檢查通過${NC}"
}

# 設置環境
setup_environment() {
    echo -e "${BLUE}🔧 設置 $ENVIRONMENT 環境...${NC}"
    
    case $ENVIRONMENT in
        development)
            export NODE_ENV=development
            export DEBUG=true
            ;;
        staging)
            export NODE_ENV=staging
            export DEBUG=false
            ;;
        production)
            export NODE_ENV=production
            export DEBUG=false
            ;;
        *)
            echo -e "${RED}❌ 未知環境: $ENVIRONMENT${NC}"
            echo "可用環境: development, staging, production"
            exit 1
            ;;
    esac
    
    # 創建環境文件
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        echo -e "${YELLOW}⚠️ 環境文件 .env.$ENVIRONMENT 不存在，使用默認配置${NC}"
        cp .env.example ".env.$ENVIRONMENT"
    fi
    
    # 加載環境變量
    set -a
    source ".env.$ENVIRONMENT"
    set +a
    
    echo -e "${GREEN}✅ 環境設置完成${NC}"
}

# 安裝前端依賴
install_frontend() {
    echo -e "${BLUE}📦 安裝前端依賴...${NC}"
    
    cd "$FRONTEND_DIR" || exit 1
    
    # 清理緩存
    rm -rf node_modules package-lock.json
    
    # 安裝依賴
    if [ "$ENVIRONMENT" = "production" ]; then
        npm ci --silent
    else
        npm install --silent
    fi
    
    # 檢查安裝是否成功
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 前端依賴安裝完成${NC}"
    else
        echo -e "${RED}❌ 前端依賴安裝失敗${NC}"
        exit 1
    fi
    
    cd ..
}

# 構建前端
build_frontend() {
    echo -e "${BLUE}🔨 構建前端應用...${NC}"
    
    cd "$FRONTEND_DIR" || exit 1
    
    # 運行測試
    if [ "$ENVIRONMENT" != "development" ]; then
        echo -e "${YELLOW}🧪 運行前端測試...${NC}"
        npm test -- --passWithNoTests
    fi
    
    # 構建應用
    if [ "$ENVIRONMENT" = "production" ]; then
        npm run build -- --mode production
    else
        npm run build -- --mode $ENVIRONMENT
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 前端構建完成${NC}"
    else
        echo -e "${RED}❌ 前端構建失敗${NC}"
        exit 1
    fi
    
    cd ..
}

# 安裝後端依賴
install_backend() {
    echo -e "${BLUE}📦 安裝後端依賴...${NC}"
    
    cd "$BACKEND_DIR" || exit 1
    
    # 創建虛擬環境
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}🐍 創建Python虛擬環境...${NC}"
        python3 -m venv venv
    fi
    
    # 激活虛擬環境
    source venv/bin/activate
    
    # 升級pip
    pip install --upgrade pip --quiet
    
    # 安裝依賴
    if [ "$ENVIRONMENT" = "production" ]; then
        pip install -r requirements.txt --quiet
    else
        pip install -r requirements-dev.txt --quiet 2>/dev/null || pip install -r requirements.txt --quiet
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 後端依賴安裝完成${NC}"
    else
        echo -e "${RED}❌ 後端依賴安裝失敗${NC}"
        exit 1
    fi
    
    # 退出虛擬環境
    deactivate
    
    cd ..
}

# 運行後端測試
run_backend_tests() {
    if [ "$ENVIRONMENT" = "development" ]; then
        echo -e "${YELLOW}🧪 跳過後端測試 (開發環境)${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🧪 運行後端測試...${NC}"
    
    cd "$BACKEND_DIR" || exit 1
    
    source venv/bin/activate
    
    # 運行測試
    python -m pytest tests/ -v --cov=./ --cov-report=xml
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 後端測試通過${NC}"
    else
        echo -e "${RED}❌ 後端測試失敗${NC}"
        exit 1
    fi
    
    deactivate
    
    cd ..
}

# Docker部署
deploy_with_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}🐳 Docker未安裝，跳過容器化部署${NC}"
        return 0
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}🐳 Docker Compose未安裝，跳過容器化部署${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🐳 使用Docker部署...${NC}"
    
    # 構建Docker鏡像
    docker-compose -f docker-compose.$ENVIRONMENT.yml build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker鏡像構建完成${NC}"
    else
        echo -e "${RED}❌ Docker鏡像構建失敗${NC}"
        exit 1
    fi
    
    # 啟動服務
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.$ENVIRONMENT.yml up -d
        echo -e "${GREEN}✅ 生產環境服務已啟動${NC}"
    else
        docker-compose -f docker-compose.$ENVIRONMENT.yml up
    fi
}

# Vercel部署
deploy_to_vercel() {
    if [ "$ENVIRONMENT" != "production" ]; then
        echo -e "${YELLOW}☁️ 跳過Vercel部署 (非生產環境)${NC}"
        return 0
    fi
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}☁️ Vercel CLI未安裝，跳過Vercel部署${NC}"
        return 0
    fi
    
    echo -e "${BLUE}☁️ 部署到Vercel...${NC}"
    
    cd "$FRONTEND_DIR" || exit 1
    
    # 部署到Vercel
    vercel --prod --confirm
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Vercel部署完成${NC}"
    else
        echo -e "${RED}❌ Vercel部署失敗${NC}"
        exit 1
    fi
    
    cd ..
}

# Railway部署
deploy_to_railway() {
    if [ "$ENVIRONMENT" != "production" ]; then
        echo -e "${YELLOW}🚂 跳過Railway部署 (非生產環境)${NC}"
        return 0
    fi
    
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}🚂 Railway CLI未安裝，跳過Railway部署${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🚂 部署到Railway...${NC}"
    
    # 部署到Railway
    railway up --service backend
    railway up --service frontend
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Railway部署完成${NC}"
    else
        echo -e "${RED}❌ Railway部署失敗${NC}"
        exit 1
    fi
}

# GitHub部署
deploy_to_github() {
    if [ "$ENVIRONMENT" != "production" ]; then
        echo -e "${YELLOW}🐙 跳過GitHub Pages部署 (非生產環境)${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🐙 部署到GitHub Pages...${NC}"
    
    # 檢查是否在Git倉庫中
    if [ ! -d ".git" ]; then
        echo -e "${YELLOW}⚠️ 不是Git倉庫，跳過GitHub部署${NC}"
        return 0
    fi
    
    # 構建前端
    cd "$FRONTEND_DIR" || exit 1
    npm run build
    cd ..
    
    # 部署到GitHub Pages
    # 注意：需要配置GitHub Actions或手動部署
    
    echo -e "${GREEN}✅ GitHub Pages部署準備完成${NC}"
}

# 顯示部署信息
show_deployment_info() {
    echo -e "\n${GREEN}🎉 部署完成!${NC}"
    echo -e "${BLUE}📊 部署摘要:${NC}"
    echo -e "  • 環境: $ENVIRONMENT"
    echo -e "  • 項目: $PROJECT_NAME"
    echo -e "  • 前端目錄: $FRONTEND_DIR"
    echo -e "  • 後端目錄: $BACKEND_DIR"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        echo -e "\n${YELLOW}🚀 啟動開發服務器:${NC}"
        echo -e "  前端: cd $FRONTEND_DIR && npm run dev"
        echo -e "  後端: cd $BACKEND_DIR && source venv/bin/activate && python main.py"
    elif [ "$ENVIRONMENT" = "production" ]; then
        echo -e "\n${YELLOW}🌐 訪問地址:${NC}"
        echo -e "  前端: https://$PROJECT_NAME.vercel.app (如果使用Vercel)"
        echo -e "  API: https://api.$PROJECT_NAME.com (如果部署了後端)"
    fi
    
    echo -e "\n${BLUE}📋 下一步:${NC}"
    echo -e "  1. 檢查應用日誌"
    echo -e "  2. 測試API端點"
    echo -e "  3. 監控系統性能"
    echo -e "  4. 配置域名和SSL"
}

# 主函數
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}   AI賽馬分析平台 - 部署工具   ${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # 執行部署步驟
    check_dependencies
    setup_environment
    
    # 前端部署
    install_frontend
    build_frontend
    
    # 後端部署
    install_backend
    run_backend_tests
    
    # 選擇部署方式
    case $2 in
        docker)
            deploy_with_docker
            ;;
        vercel)
            deploy_to_vercel
            ;;
        railway)
            deploy_to_railway
            ;;
        github)
            deploy_to_github
            ;;
        *)
            echo -e "${YELLOW}🚀 使用默認本地部署${NC}"
            # 本地部署，顯示啟動指令
            ;;
    esac
    
    show_deployment_info
}

# 運行主函數
main "$@"