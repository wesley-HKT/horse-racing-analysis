# AI賽馬分析平台 - PowerShell部署腳本
# 用法: .\deploy.ps1 [環境] [部署方式]

param(
    [string]$Environment = "development",
    [string]$DeployMethod = "local"
)

Write-Host "🚀 開始部署 AI賽馬分析平台 ($Environment 環境)" -ForegroundColor Blue

# 變量定義
$ProjectName = "horse-racing-analysis"
$FrontendDir = ".\frontend"
$BackendDir = ".\backend"

# 檢查依賴
function Check-Dependencies {
    Write-Host "🔍 檢查系統依賴..." -ForegroundColor Blue
    
    $missingDeps = @()
    
    # 檢查Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        $missingDeps += "Node.js"
    }
    
    # 檢查npm
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        $missingDeps += "npm"
    }
    
    # 檢查Python
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        $missingDeps += "Python 3"
    }
    
    # 檢查Docker (可選)
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "⚠️  Docker未安裝，跳過容器化部署" -ForegroundColor Yellow
    }
    
    if ($missingDeps.Count -gt 0) {
        Write-Host "❌ 缺少必要依賴: $($missingDeps -join ', ')" -ForegroundColor Red
        Write-Host "請安裝缺少的依賴後重試"
        exit 1
    }
    
    Write-Host "✅ 所有依賴檢查通過" -ForegroundColor Green
}

# 設置環境
function Setup-Environment {
    Write-Host "🔧 設置 $Environment 環境..." -ForegroundColor Blue
    
    switch ($Environment) {
        "development" {
            $env:NODE_ENV = "development"
            $env:DEBUG = "true"
        }
        "staging" {
            $env:NODE_ENV = "staging"
            $env:DEBUG = "false"
        }
        "production" {
            $env:NODE_ENV = "production"
            $env:DEBUG = "false"
        }
        default {
            Write-Host "❌ 未知環境: $Environment" -ForegroundColor Red
            Write-Host "可用環境: development, staging, production"
            exit 1
        }
    }
    
    # 檢查環境文件
    $envFile = ".env.$Environment"
    if (-not (Test-Path $envFile)) {
        Write-Host "⚠️ 環境文件 $envFile 不存在，使用默認配置" -ForegroundColor Yellow
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" $envFile
        }
    }
    
    # 加載環境變量
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                $envName = $matches[1].Trim()
                $envValue = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($envName, $envValue, "Process")
            }
        }
    }
    
    Write-Host "✅ 環境設置完成" -ForegroundColor Green
}

# 安裝前端依賴
function Install-Frontend {
    Write-Host "📦 安裝前端依賴..." -ForegroundColor Blue
    
    Push-Location $FrontendDir
    
    try {
        # 清理緩存
        if (Test-Path "node_modules") {
            Remove-Item -Recurse -Force node_modules
        }
        if (Test-Path "package-lock.json") {
            Remove-Item -Force package-lock.json
        }
        
        # 安裝依賴
        if ($Environment -eq "production") {
            npm ci --silent
        } else {
            npm install --silent
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 前端依賴安裝完成" -ForegroundColor Green
        } else {
            Write-Host "❌ 前端依賴安裝失敗" -ForegroundColor Red
            exit 1
        }
    }
    finally {
        Pop-Location
    }
}

# 構建前端
function Build-Frontend {
    Write-Host "🔨 構建前端應用..." -ForegroundColor Blue
    
    Push-Location $FrontendDir
    
    try {
        # 運行測試
        if ($Environment -ne "development") {
            Write-Host "🧪 運行前端測試..." -ForegroundColor Yellow
            npm test -- --passWithNoTests
        }
        
        # 構建應用
        if ($Environment -eq "production") {
            npm run build -- --mode production
        } else {
            npm run build -- --mode $Environment
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 前端構建完成" -ForegroundColor Green
        } else {
            Write-Host "❌ 前端構建失敗" -ForegroundColor Red
            exit 1
        }
    }
    finally {
        Pop-Location
    }
}

# 安裝後端依賴
function Install-Backend {
    Write-Host "📦 安裝後端依賴..." -ForegroundColor Blue
    
    Push-Location $BackendDir
    
    try {
        # 創建虛擬環境
        if (-not (Test-Path "venv")) {
            Write-Host "🐍 創建Python虛擬環境..." -ForegroundColor Yellow
            python -m venv venv
        }
        
        # 激活虛擬環境
        $venvPath = ".\venv\Scripts\Activate.ps1"
        if (Test-Path $venvPath) {
            & $venvPath
        }
        
        # 升級pip
        python -m pip install --upgrade pip --quiet
        
        # 安裝依賴
        if ($Environment -eq "production") {
            pip install -r requirements.txt --quiet
        } else {
            $devReq = "requirements-dev.txt"
            if (Test-Path $devReq) {
                pip install -r $devReq --quiet
            } else {
                pip install -r requirements.txt --quiet
            }
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 後端依賴安裝完成" -ForegroundColor Green
        } else {
            Write-Host "❌ 後端依賴安裝失敗" -ForegroundColor Red
            exit 1
        }
    }
    finally {
        Pop-Location
    }
}

# 運行後端測試
function Run-BackendTests {
    if ($Environment -eq "development") {
        Write-Host "🧪 跳過後端測試 (開發環境)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🧪 運行後端測試..." -ForegroundColor Blue
    
    Push-Location $BackendDir
    
    try {
        $venvPath = ".\venv\Scripts\Activate.ps1"
        if (Test-Path $venvPath) {
            & $venvPath
        }
        
        # 運行測試
        python -m pytest tests/ -v --cov=./ --cov-report=xml
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 後端測試通過" -ForegroundColor Green
        } else {
            Write-Host "❌ 後端測試失敗" -ForegroundColor Red
            exit 1
        }
    }
    finally {
        Pop-Location
    }
}

# Vercel部署
function Deploy-ToVercel {
    if ($Environment -ne "production") {
        Write-Host "☁️ 跳過Vercel部署 (非生產環境)" -ForegroundColor Yellow
        return
    }
    
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Host "☁️ Vercel CLI未安裝，跳過Vercel部署" -ForegroundColor Yellow
        return
    }
    
    Write-Host "☁️ 部署到Vercel..." -ForegroundColor Blue
    
    Push-Location $FrontendDir
    
    try {
        # 部署到Vercel
        vercel --prod --confirm
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Vercel部署完成" -ForegroundColor Green
        } else {
            Write-Host "❌ Vercel部署失敗" -ForegroundColor Red
            exit 1
        }
    }
    finally {
        Pop-Location
    }
}

# 顯示部署信息
function Show-DeploymentInfo {
    Write-Host "`n🎉 部署完成!" -ForegroundColor Green
    Write-Host "📊 部署摘要:" -ForegroundColor Blue
    Write-Host "  • 環境: $Environment"
    Write-Host "  • 項目: $ProjectName"
    Write-Host "  • 前端目錄: $FrontendDir"
    Write-Host "  • 後端目錄: $BackendDir"
    
    if ($Environment -eq "development") {
        Write-Host "`n🚀 啟動開發服務器:" -ForegroundColor Yellow
        Write-Host "  前端: cd $FrontendDir ; npm run dev"
        Write-Host "  後端: cd $BackendDir ; .\venv\Scripts\Activate ; python main.py"
    } elseif ($Environment -eq "production") {
        Write-Host "`n🌐 訪問地址:" -ForegroundColor Yellow
        Write-Host "  前端: https://$ProjectName.vercel.app (如果使用Vercel)"
        Write-Host "  API: https://api.$ProjectName.com (如果部署了後端)"
    }
    
    Write-Host "`n📋 下一步:" -ForegroundColor Blue
    Write-Host "  1. 檢查應用日誌"
    Write-Host "  2. 測試API端點"
    Write-Host "  3. 監控系統性能"
    Write-Host "  4. 配置域名和SSL"
}

# 主流程
Write-Host "========================================" -ForegroundColor Blue
Write-Host "   AI賽馬分析平台 - 部署工具   " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue

# 執行部署步驟
Check-Dependencies
Setup-Environment

# 前端部署
Install-Frontend
Build-Frontend

# 後端部署
Install-Backend
Run-BackendTests

# 選擇部署方式
switch ($DeployMethod) {
    "vercel" {
        Deploy-ToVercel
    }
    "local" {
        Write-Host "🚀 使用本地部署" -ForegroundColor Yellow
    }
    default {
        Write-Host "🚀 使用默認本地部署" -ForegroundColor Yellow
    }
}

Show-DeploymentInfo