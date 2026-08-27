# AI賽馬分析項目 - GitHub設置腳本
# 用法: .\setup-github.ps1 [GitHub用戶名]

param(
    [string]$GitHubUsername = "",
    [string]$RepositoryName = "horse-racing-analysis",
    [switch]$UseSSH = $false
)

Write-Host "🚀 AI賽馬分析項目 - GitHub部署助手" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# 檢查參數
if ([string]::IsNullOrWhiteSpace($GitHubUsername)) {
    $GitHubUsername = Read-Host "請輸入你的GitHub用戶名"
}

if ([string]::IsNullOrWhiteSpace($GitHubUsername)) {
    Write-Host "❌ 必須提供GitHub用戶名" -ForegroundColor Red
    exit 1
}

# 顯示配置信息
Write-Host "`n📋 配置信息:" -ForegroundColor Yellow
Write-Host "  • GitHub用戶名: $GitHubUsername" -ForegroundColor White
Write-Host "  • 倉庫名稱: $RepositoryName" -ForegroundColor White
Write-Host "  • 使用SSH: $UseSSH" -ForegroundColor White

Write-Host "`n1️⃣ 檢查Git狀態..." -ForegroundColor Blue

# 檢查Git狀態
$gitStatus = git status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 不是Git倉庫或Git未安裝" -ForegroundColor Red
    exit 1
}

# 檢查是否有未提交的更改
$changes = git status --porcelain
if ($changes) {
    Write-Host "⚠️  發現未提交的更改" -ForegroundColor Yellow
    Write-Host $changes -ForegroundColor Gray
    $choice = Read-Host "是否提交更改? (y/n)"
    if ($choice -eq 'y') {
        git add .
        $commitMessage = Read-Host "輸入提交信息"
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "更新: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        }
        git commit -m $commitMessage
        Write-Host "✅ 更改已提交" -ForegroundColor Green
    }
}

Write-Host "`n2️⃣ 設置Git遠程倉庫..." -ForegroundColor Blue

# 設置遠程倉庫URL
if ($UseSSH) {
    $remoteUrl = "git@github.com:$GitHubUsername/$RepositoryName.git"
} else {
    $remoteUrl = "https://github.com/$GitHubUsername/$RepositoryName.git"
}

# 檢查是否已有遠程倉庫
$existingRemote = git remote -v
if ($existingRemote -like "*origin*") {
    Write-Host "⚠️  已存在遠程倉庫 'origin'" -ForegroundColor Yellow
    $choice = Read-Host "是否移除現有遠程倉庫並設置新的? (y/n)"
    if ($choice -eq 'y') {
        git remote remove origin
        Write-Host "✅ 已移除現有遠程倉庫" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  保留現有遠程倉庫" -ForegroundColor Cyan
        exit 0
    }
}

# 添加新的遠程倉庫
Write-Host "添加遠程倉庫: $remoteUrl" -ForegroundColor White
git remote add origin $remoteUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 遠程倉庫設置完成" -ForegroundColor Green
} else {
    Write-Host "❌ 遠程倉庫設置失敗" -ForegroundColor Red
    exit 1
}

Write-Host "`n3️⃣ 推送代碼到GitHub..." -ForegroundColor Blue

# 檢查當前分支
$currentBranch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    $currentBranch = "main"
}

# 推送代碼
Write-Host "推送分支: $currentBranch" -ForegroundColor White
git push -u origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 代碼推送成功!" -ForegroundColor Green
} else {
    Write-Host "❌ 代碼推送失敗" -ForegroundColor Red
    Write-Host "可能的原因:" -ForegroundColor Yellow
    Write-Host "  1. GitHub倉庫不存在" -ForegroundColor White
    Write-Host "  2. 沒有權限" -ForegroundColor White
    Write-Host "  3. 網絡問題" -ForegroundColor White
    Write-Host "`n請手動創建倉庫: https://github.com/new" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n4️⃣ 顯示部署信息..." -ForegroundColor Blue

# 顯示部署信息
$websiteUrls = @(
    "GitHub倉庫: https://github.com/$GitHubUsername/$RepositoryName",
    "GitHub Pages: https://$GitHubUsername.github.io/$RepositoryName/",
    "Raw代碼: https://github.com/$GitHubUsername/$RepositoryName/raw/main/README.md"
)

Write-Host "`n🌐 訪問地址:" -ForegroundColor Green
foreach ($url in $websiteUrls) {
    Write-Host "  • $url" -ForegroundColor White
}

Write-Host "`n📊 下一步操作:" -ForegroundColor Yellow
Write-Host "  1. 訪問GitHub倉庫檢查代碼" -ForegroundColor White
Write-Host "  2. 在Settings中啟用GitHub Pages" -ForegroundColor White
Write-Host "  3. 配置自定義域名 (可選)" -ForegroundColor White
Write-Host "  4. 設置GitHub Actions Secrets (如果需要)" -ForegroundColor White

Write-Host "`n🔧 本地開發命令:" -ForegroundColor Cyan
Write-Host "  前端開發: cd frontend ; npm run dev" -ForegroundColor White
Write-Host "  前端構建: cd frontend ; npm run build" -ForegroundColor White
Write-Host "  查看構建: cd frontend ; npm run preview" -ForegroundColor White

Write-Host "`n🎉 部署完成! 你的AI賽馬分析平台現已上線。" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Cyan

# 打開瀏覽器
$openBrowser = Read-Host "是否在瀏覽器中打開GitHub倉庫? (y/n)"
if ($openBrowser -eq 'y') {
    Start-Process "https://github.com/$GitHubUsername/$RepositoryName"
}