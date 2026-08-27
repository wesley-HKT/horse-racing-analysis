# 部署指南

本文檔提供AI賽馬分析網頁的多種部署方案。

## 部署選項概覽

| 平台 | 類型 | 適合場景 | 成本 | 難度 |
|------|------|----------|------|------|
| Vercel | 前端部署 | 快速靜態部署 | 免費計劃 | ⭐ |
| Railway | 全棧部署 | 簡單全棧方案 | $5+/月 | ⭐⭐ |
| AWS | 雲部署 | 生產環境 | $10+/月 | ⭐⭐⭐⭐ |
| Docker | 容器部署 | 本地/服務器 | 免費 | ⭐⭐⭐ |

## 1. Vercel部署 (推薦)

Vercel最適合前端部署，提供CDN、SSL和自動部署。

### 步驟：

1. **準備前端代碼**：
```bash
cd frontend
npm run build
```

2. **安裝Vercel CLI**：
```bash
npm i -g vercel
```

3. **部署**：
```bash
vercel
# 或
vercel --prod
```

4. **環境變量**：
在Vercel控制台設置：
```
VITE_API_URL=https://your-backend-api.com
```

### 優點：
- 免費計劃包含100GB帶寬
- 自動SSL證書
- 全球CDN
- 自動GitHub集成

## 2. Railway部署 (全棧)

Railway適合簡單的全棧部署。

### 步驟：

1. **安裝Railway CLI**：
```bash
npm i -g @railway/cli
```

2. **登錄**：
```bash
railway login
```

3. **初始化項目**：
```bash
railway init
```

4. **創建服務**：
```bash
# 後端服務
railway service create backend

# 前端服務  
railway service create frontend

# 數據庫
railway add postgresql
railway add redis
```

5. **部署**：
```bash
railway up
```

### Railway配置示例 (`railway.toml`)：
```toml
[service.backend]
name = "horse-racing-backend"
root = "backend"
command = "uvicorn main:app --host 0.0.0.0 --port $PORT"
build.command = "pip install -r requirements.txt"
build.watch = ["backend/**"]

[service.frontend]
name = "horse-racing-frontend"
root = "frontend"
command = "npm start"
build.command = "npm run build"
build.watch = ["frontend/**"]
```

## 3. Docker部署

### Docker Compose配置 (`docker-compose.yml`)：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: horse_racing
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://admin:secure_password@postgres:5432/horse_racing
      REDIS_URL: redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./backend:/app
      - model_cache:/app/models

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      VITE_API_URL: http://localhost:8000
    depends_on:
      - backend

  celery:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A tasks.celery_app worker --loglevel=info
    environment:
      DATABASE_URL: postgresql://admin:secure_password@postgres:5432/horse_racing
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - backend
      - redis
    volumes:
      - ./backend:/app

  flower:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A tasks.celery_app flower
    ports:
      - "5555:5555"
    environment:
      DATABASE_URL: postgresql://admin:secure_password@postgres:5432/horse_racing
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - celery
      - redis

volumes:
  postgres_data:
  redis_data:
  model_cache:
```

### 後端Dockerfile (`backend/Dockerfile`)：
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 複製依賴文件
COPY requirements.txt .

# 安裝Python依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用代碼
COPY . .

# 創建非root用戶
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 啟動命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 前端Dockerfile (`frontend/Dockerfile`)：
```dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# 複製package文件
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製源代碼
COPY . .

# 構建應用
RUN npm run build

# 生產階段
FROM nginx:alpine

# 複製構建文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 啟動nginx
CMD ["nginx", "-g", "daemon off;"]
```

## 4. GitHub Pages部署

### 步驟：
1. **配置前端**：
```bash
cd frontend
# 在vite.config.ts中設置base路徑
export default defineConfig({
  base: '/horse-racing-analysis/',
  // ...
})
```

2. **創建GitHub Actions工作流** (`.github/workflows/deploy.yml`)：
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pages: write
      id-token: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Build
        run: |
          cd frontend
          npm run build
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

## 5. AWS部署 (ECS/Fargate)

### 架構：
```
Internet → CloudFront → S3 (前端) → ALB → ECS/Fargate (後端)
                              ↓
                         RDS (PostgreSQL) + ElastiCache (Redis)
```

### 主要步驟：
1. **創建ECR倉庫**：存儲Docker鏡像
2. **設置RDS數據庫**：PostgreSQL實例
3. **配置ElastiCache**：Redis緩存
4. **創建ECS集群**：運行容器
5. **設置ALB**：負載均衡
6. **配置CloudFront**：CDN加速

## 環境變量配置

### 後端環境變量 (`.env`)：
```env
# 數據庫配置
DATABASE_URL=postgresql://user:password@localhost:5432/horse_racing
REDIS_URL=redis://localhost:6379/0

# API配置
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False

# 安全配置
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=jwt-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS配置
CORS_ORIGINS=["http://localhost:3000","https://your-domain.com"]

# 數據源配置
RACING_API_KEY=your-api-key
WEATHER_API_KEY=your-weather-api-key
```

### 前端環境變量 (`.env.production`)：
```env
VITE_API_URL=https://your-backend-api.com
VITE_APP_NAME=AI賽馬分析
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxxxxxxxxxxxx.ingest.sentry.io/xxxxxxx
```

## 監控和日誌

### 推薦工具：
1. **Sentry**：錯誤追蹤
2. **Datadog/New Relic**：應用性能監控
3. **Logtail/Papertrail**：日誌管理
4. **UptimeRobot**：可用性監控

### 健康檢查端點：
```bash
# 後端健康檢查
GET /health

# 數據庫健康檢查  
GET /health/db

# Redis健康檢查
GET /health/redis
```

## 備份策略

### 數據備份：
```bash
# PostgreSQL備份
pg_dump -U admin -d horse_racing -f backup.sql

# Redis備份
redis-cli SAVE
```

### 自動備份腳本：
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U $DB_USER -d $DB_NAME -f backup_${DATE}.sql
gzip backup_${DATE}.sql
aws s3 cp backup_${DATE}.sql.gz s3://your-backup-bucket/
```

## 性能優化

### 前端優化：
- 代碼分割和懶加載
- 圖片壓縮和WebP格式
- 服務器端渲染(SSR)可選
- CDN緩存策略

### 後端優化：
- 數據庫查詢優化
- Redis緩存策略
- 連接池配置
- 異步任務處理

## 安全建議

1. **HTTPS強制**：所有流量使用SSL
2. **CORS配置**：僅允許可信域名
3. **速率限制**：防止API濫用
4. **輸入驗證**：所有輸入數據驗證
5. **SQL注入防護**：使用ORM或參數化查詢
6. **定期更新**：保持依賴庫最新

## 故障排除

### 常見問題：

1. **數據庫連接失敗**：
```bash
# 檢查數據庫狀態
docker-compose logs postgres
```

2. **API服務無法啟動**：
```bash
# 檢查後端日誌
docker-compose logs backend
```

3. **前端無法訪問API**：
```bash
# 檢查CORS配置和網絡連接
curl http://localhost:8000/health
```

### 日誌查看：
```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs backend
```

## 成本估算

| 資源 | Vercel | Railway | AWS (小型) | 自托管 |
|------|--------|---------|------------|---------|
| 前端托管 | 免費 | $5/月 | $5/月 | 服務器成本 |
| 後端服務 | - | $5/月 | $10/月 | 服務器成本 |
| 數據庫 | - | $7/月 | $15/月 | 服務器成本 |
| Redis | - | $5/月 | $10/月 | 服務器成本 |
| CDN | 包含 | - | $5/月 | 自備帶寬 |
| **月總計** | **$0** | **$22** | **$45** | **$20-50** |

## 擴展建議

1. **微服務架構**：將AI模型、數據處理等拆分
2. **消息隊列**：使用RabbitMQ或Kafka
3. **數據倉庫**：添加ClickHouse或Snowflake
4. **實時分析**：集成Apache Flink或Spark
5. **移動應用**：使用React Native開發APP