# GitHub部署指南

本文檔詳細說明如何將AI賽馬分析平台部署到GitHub並設置自動化部署流程。

## 部署選項概覽

### 1. GitHub Pages (靜態前端)
- **適合**: 純前端應用
- **優點**: 免費、簡單、自動HTTPS
- **限制**: 僅靜態文件，需要後端API

### 2. GitHub Actions + Vercel (全棧部署)
- **適合**: 前後端分離應用
- **優點**: 自動CI/CD，免費計劃
- **配置**: 需要Vercel帳號

### 3. GitHub Actions + Railway (全棧部署)
- **適合**: 完整後端服務
- **優點**: 簡單的全棧部署
- **配置**: 需要Railway帳號

## 部署步驟

### 步驟1: 創建GitHub倉庫

1. 訪問 [GitHub](https://github.com)
2. 點擊右上角 "+" → "New repository"
3. 填寫倉庫信息:
   - Repository name: `horse-racing-analysis`
   - Description: `AI賽馬分析平台 - 基於大數據和機器學習`
   - Public (公開)
   - 不要初始化README.md (我們已經有了)
4. 點擊 "Create repository"

### 步驟2: 推送本地代碼到GitHub

```bash
# 添加遠程倉庫
git remote add origin https://github.com/你的用戶名/horse-racing-analysis.git

# 推送代碼
git push -u origin main
```

或者使用SSH:
```bash
git remote add origin git@github.com:你的用戶名/horse-racing-analysis.git
git push -u origin main
```

### 步驟3: 配置GitHub Secrets

在GitHub倉庫設置中添加以下secrets:

1. **VERCEL_TOKEN** (如果使用Vercel)
   - 獲取: `vercel login` → `vercel token`
   - 用途: 自動部署到Vercel

2. **RAILWAY_TOKEN** (如果使用Railway)
   - 獲取: `railway login` → `railway token`
   - 用途: 自動部署到Railway

3. **SLACK_WEBHOOK_URL** (可選)
   - 獲取: Slack App Webhook URL
   - 用途: 部署通知

### 步驟4: 啟用GitHub Actions

我們的項目已經包含CI/CD工作流 (`.github/workflows/ci-cd.yml`)，推送後會自動啟用。

## 詳細部署方案

### 方案A: GitHub Pages (推薦用於演示)

#### 配置前端
```bash
cd frontend
```

編輯 `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/horse-racing-analysis/',  // 倉庫名稱
  // ...
})
```

#### 創建GitHub Actions工作流
工作流文件已經創建在 `.github/workflows/ci-cd.yml` 中，包含GitHub Pages部署。

#### 啟用GitHub Pages
1. 進入倉庫設置 → Pages
2. 分支: `gh-pages`
3. 文件夾: `/ (root)`
4. 保存

#### 訪問網站
- URL: `https://你的用戶名.github.io/horse-racing-analysis/`

### 方案B: Vercel部署 (推薦用於生產)

#### 手動部署
```bash
# 安裝Vercel CLI
npm install -g vercel

# 登錄
vercel login

# 部署前端
cd frontend
vercel --prod
```

#### 自動部署 (使用GitHub Actions)
1. 在Vercel導入GitHub倉庫
2. 配置環境變量:
   - `VITE_API_URL`: 後端API地址
3. 啟用自動部署

#### 自定義域名
1. 在Vercel控制台添加域名
2. 配置DNS記錄
3. 自動獲取SSL證書

### 方案C: Railway部署 (全棧方案)

#### 創建Railway項目
```bash
# 安裝Railway CLI
npm install -g @railway/cli

# 登錄
railway login

# 初始化項目
railway init
```

#### 部署服務
```bash
# 部署後端
railway up --service backend

# 部署前端  
railway up --service frontend

# 添加數據庫
railway add postgresql
railway add redis
```

#### 配置環境變量
在Railway控制台設置:
- `DATABASE_URL`: PostgreSQL連接字符串
- `REDIS_URL`: Redis連接字符串
- `API_HOST`: `0.0.0.0`
- `API_PORT`: `$PORT`

## 環境配置

### 開發環境
```bash
# 克隆倉庫
git clone https://github.com/你的用戶名/horse-racing-analysis.git
cd horse-racing-analysis

# 安裝依賴
cd frontend && npm install
cd ../backend && pip install -r requirements.txt

# 啟動服務
# 前端
cd frontend && npm run dev

# 後端 (新終端)
cd backend && python main.py
```

### 生產環境配置
創建 `.env.production`:
```env
# 後端配置
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379/0
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=jwt-secret-key

# 前端配置
VITE_API_URL=https://api.yourdomain.com
```

## 自動化部署流程

我們的CI/CD流程包括:

1. **測試階段**:
   - 前端代碼檢查和測試
   - 後端代碼檢查和測試

2. **構建階段**:
   - 構建Docker鏡像
   - 推送到GitHub Container Registry

3. **部署階段**:
   - 開發分支 → 測試環境
   - 主分支 → 生產環境

4. **監控階段**:
   - 安全掃描
   - 部署通知

## 域名配置

### 自定義域名
1. **購買域名**: Namecheap, GoDaddy等
2. **配置DNS**:
   - A記錄 → Vercel IP地址
   - CNAME → Railway域名
3. **SSL證書**: 自動由Vercel/Railway提供

### 域名示例
```
主站: https://horseracing.ai
API: https://api.horseracing.ai
文檔: https://docs.horseracing.ai
```

## 監控和維護

### 性能監控
- **前端**: Vercel Analytics
- **後端**: Railway Metrics
- **錯誤追蹤**: Sentry
- **日誌**: Logtail

### 定期維護
1. **依賴更新**:
   ```bash
   # 前端
   cd frontend && npm update
   
   # 後端
   cd backend && pip install --upgrade -r requirements.txt
   ```

2. **數據備份**:
   ```bash
   # PostgreSQL備份
   pg_dump -U user -d horse_racing > backup.sql
   
   # Redis備份
   redis-cli SAVE
   ```

3. **安全掃描**:
   ```bash
   # 使用GitHub安全掃描
   # 或手動掃描
   npm audit
   pip-audit
   ```

## 故障排除

### 常見問題

#### 1. 部署失敗
```bash
# 查看日誌
git log --oneline
git status

# 檢查GitHub Actions日誌
# 在倉庫頁面點擊 Actions → 查看運行詳情
```

#### 2. 環境變量問題
```bash
# 檢查環境變量
echo $DATABASE_URL
echo $VITE_API_URL

# 測試連接
psql $DATABASE_URL -c "SELECT 1"
redis-cli -u $REDIS_URL PING
```

#### 3. 構建失敗
```bash
# 清理緩存
cd frontend && rm -rf node_modules package-lock.json
cd backend && rm -rf venv

# 重新安裝
./deploy.ps1 development
```

### 日誌查看
```bash
# GitHub Actions日誌
# 在倉庫頁面查看

# Vercel日誌
vercel logs

# Railway日誌
railway logs
```

## 成本估算

| 服務 | 免費計劃 | 生產環境成本 |
|------|----------|--------------|
| GitHub | 完全免費 | $0 |
| GitHub Pages | 100GB/月 | $0 |
| Vercel | 100GB/月 | $20+/月 |
| Railway | $5/月信用 | $20+/月 |
| 域名 | - | $10-20/年 |

## 最佳實踐

### 1. 分支策略
- `main`: 生產環境代碼
- `develop`: 開發環境代碼  
- `feature/*`: 功能分支
- `hotfix/*`: 緊急修復

### 2. 提交規範
```
feat: 新增功能
fix: 修復bug
docs: 文檔更新
style: 代碼格式
refactor: 重構代碼
test: 測試相關
chore: 構建過程
```

### 3. 安全實踐
- 不要提交敏感數據到Git
- 使用環境變量管理密鑰
- 定期更新依賴庫
- 啟用雙因素認證

### 4. 性能優化
- 啟用代碼分割
- 使用CDN緩存
- 優化圖片資源
- 啟用Gzip壓縮

## 擴展部署

### Docker部署
```bash
# 構建鏡像
docker build -t horse-racing-frontend -f frontend/Dockerfile .
docker build -t horse-racing-backend -f backend/Dockerfile .

# 運行容器
docker-compose up -d
```

### Kubernetes部署
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: horse-racing-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: horse-racing-backend
  template:
    metadata:
      labels:
        app: horse-racing-backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/你的用戶名/horse-racing-analysis:latest
        ports:
        - containerPort: 8000
```

### Serverless部署
```yaml
# serverless.yml
service: horse-racing-analysis

provider:
  name: aws
  runtime: python3.11
  region: ap-east-1

functions:
  api:
    handler: handler.main
    events:
      - httpApi: '*'
```

## 支持資源

### 官方文檔
- [GitHub Actions](https://docs.github.com/actions)
- [Vercel](https://vercel.com/docs)
- [Railway](https://docs.railway.app)
- [FastAPI](https://fastapi.tiangolo.com)

### 社區支持
- [GitHub Discussions](https://github.com/你的用戶名/horse-racing-analysis/discussions)
- [Stack Overflow](https://stackoverflow.com)
- [Discord社區](https://discord.gg/)

### 監控工具
- [UptimeRobot](https://uptimerobot.com) - 可用性監控
- [Google Analytics](https://analytics.google.com) - 流量分析
- [Hotjar](https://hotjar.com) - 用戶行為分析

## 更新日誌

### v1.0.0 (初始版本)
- 前端React應用框架
- 後端FastAPI服務框架
- 完整的CI/CD流水線
- 多種部署方案支持
- 詳細部署文檔

---

**下一步**: 按照上面的指南將項目推送到GitHub，然後選擇適合的部署方案開始部署。