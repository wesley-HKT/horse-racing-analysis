# AI賽馬分析網頁

一個專業的AI驅動賽馬分析平台，利用大數據和機器學習提供賽馬預測、數據分析和實時監控功能。

## 項目特色

- 🏇 **AI賽馬預測**: 基於歷史數據的智能預測模型
- 📊 **數據可視化**: 豐富的圖表和數據分析工具
- ⚡ **實時監控**: 實時賠率追蹤和異常檢測
- 🤖 **機器學習**: 多種AI模型集成
- 📱 **響應式設計**: 適配各種設備

## 技術棧

### 前端
- React 18 + TypeScript
- Ant Design 5.0
- Redux Toolkit + RTK Query
- Recharts + D3.js
- Vite

### 後端
- FastAPI + Python 3.11
- PostgreSQL + Redis
- Pandas + NumPy
- Scikit-learn + XGBoost
- Celery + Redis

## 快速開始

### 環境要求
- Node.js 20+
- Python 3.11+
- PostgreSQL 16+
- Redis 7+

### 安裝步驟

1. 克隆項目：
```bash
git clone https://github.com/yourusername/horse-racing-analysis.git
cd horse-racing-analysis
```

2. 設置後端：
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. 設置前端：
```bash
cd ../frontend
npm install
```

4. 配置環境變量：
```bash
cp .env.example .env
# 編輯 .env 文件設置數據庫連接等
```

5. 啟動開發服務器：
```bash
# 後端
cd backend
uvicorn main:app --reload

# 前端 (新終端)
cd frontend
npm run dev
```

## 部署選項

### 1. Vercel (推薦前端部署)
```bash
# 安裝Vercel CLI
npm i -g vercel

# 部署前端
cd frontend
vercel
```

### 2. Railway (全棧部署)
```bash
# 安裝Railway CLI
npm i -g @railway/cli

# 部署
railway up
```

### 3. Docker部署
```bash
# 構建鏡像
docker-compose build

# 啟動服務
docker-compose up
```

## 項目結構

```
horse-racing-analysis/
├── frontend/           # 前端代碼
│   ├── src/
│   │   ├── components/ # 可重用組件
│   │   ├── pages/     # 頁面組件
│   │   ├── services/  # API服務
│   │   └── store/     # 狀態管理
├── backend/           # 後端代碼
│   ├── api/          # API路由
│   ├── services/     # 業務邏輯
│   ├── ai/           # AI模型
│   └── models/       # 數據模型
├── docs/             # 文檔
└── deployments/      # 部署配置
```

## API文檔

啟動後端服務後訪問：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 數據源

- 香港賽馬會歷史數據
- 國際賽馬數據API
- 實時賠率數據流
- 天氣和場地數據

## 開發指南

### 代碼規範
- 前端: ESLint + Prettier
- 後端: Black + isort
- 提交信息: Conventional Commits

### 測試
```bash
# 前端測試
cd frontend
npm test

# 後端測試
cd backend
pytest
```

### 構建
```bash
# 前端生產構建
cd frontend
npm run build

# 後端生產啟動
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 貢獻指南

1. Fork項目
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟Pull Request

## 許可證

MIT License

## 聯繫方式

- 問題反饋: [GitHub Issues](https://github.com/yourusername/horse-racing-analysis/issues)
- 功能建議: [GitHub Discussions](https://github.com/yourusername/horse-racing-analysis/discussions)

## 部署狀態

[![Vercel](https://vercelbadge.vercel.app/api/yourusername/horse-racing-analysis)](https://horse-racing-analysis.vercel.app)
[![GitHub Actions](https://github.com/yourusername/horse-racing-analysis/workflows/CI/CD/badge.svg)](https://github.com/yourusername/horse-racing-analysis/actions)