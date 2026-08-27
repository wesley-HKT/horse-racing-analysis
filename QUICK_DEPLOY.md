# 🚀 快速部署指南

本指南幫助你快速將AI賽馬分析項目部署到GitHub。

## 前置要求
- GitHub帳號 (如果沒有，請先註冊)
- Git已安裝 (項目中已初始化)

## 部署步驟

### 步驟1: 創建GitHub倉庫
1. 訪問 [GitHub](https://github.com)
2. 點擊右上角 "+" → "New repository"
3. 填寫倉庫信息:
   - **Repository name**: `horse-racing-analysis`
   - **Description**: `AI賽馬分析平台 - 基於大數據和機器學習`
   - **Public** (公開)
   - **不要**初始化README.md
4. 點擊 "Create repository"

### 步驟2: 設置Git遠程倉庫
在項目目錄中執行:
```powershell
# 進入項目目錄
cd "c:\Users\wesle\.claude\horse-racing-analysis"

# 添加遠程倉庫 (替換 YOUR_USERNAME 為你的GitHub用戶名)
git remote add origin https://github.com/YOUR_USERNAME/horse-racing-analysis.git

# 或者使用SSH (推薦)
git remote add origin git@github.com:YOUR_USERNAME/horse-racing-analysis.git
```

### 步驟3: 推送代碼到GitHub
```powershell
# 推送代碼
git push -u origin main

# 如果出現錯誤，可能需要重命名分支
git branch -M main
git push -u origin main
```

### 步驟4: 啟用GitHub Pages (可選)
1. 進入GitHub倉庫頁面
2. 點擊 "Settings" → "Pages"
3. 分支: `main`
4. 文件夾: `/ (root)` 或 `/docs`
5. 保存

### 步驟5: 訪問部署的網站
- GitHub Pages: `https://YOUR_USERNAME.github.io/horse-racing-analysis/`
- 查看部署狀態: 倉庫頁面 → Actions

## 自動部署配置

項目已包含 `.github/workflows/ci-cd.yml`，推送後會自動:
1. 運行測試
2. 構建前端
3. 部署到GitHub Pages (如果啟用)

## 本地測試

### 運行前端
```powershell
cd frontend
npm install
npm run dev
# 訪問 http://localhost:3000
```

### 構建生產版本
```powershell
cd frontend
npm run build
# 生成的文件在 dist/ 文件夾
```

## 故障排除

### 1. 推送失敗
```powershell
# 檢查遠程倉庫
git remote -v

# 強制推送 (謹慎使用)
git push -u origin main --force
```

### 2. GitHub Pages未顯示
- 檢查Pages設置是否正確
- 等待幾分鐘讓GitHub處理
- 檢查Actions日誌

### 3. 構建失敗
```powershell
# 清理緩存
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 後續步驟

### 添加自定義域名
1. 購買域名
2. 在GitHub Pages設置中添加域名
3. 配置DNS記錄

### 啟用分析
- Google Analytics
- GitHub Analytics
- Vercel Analytics

### 監控部署
- GitHub Actions日誌
- GitHub Pages狀態
- 網站可用性監控

## 聯繫支持

如有問題，請:
1. 查看GitHub Actions日誌
2. 檢查項目README.md
3. 創建GitHub Issue

---

**恭喜！** 你的AI賽馬分析平台現在已部署到GitHub。🎉