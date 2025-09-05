# Simple GitHub Deployment Script for SOFLOTTO
Write-Host "🚀 SOFLOTTO GitHub Deployment" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git not initialized. Please run:" -ForegroundColor Red
    Write-Host "   git init" -ForegroundColor Yellow
    Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Yellow
    exit 1
}

# Check if remote exists
try {
    $remote = git remote get-url origin
    Write-Host "✅ Remote found: $remote" -ForegroundColor Green
} catch {
    Write-Host "❌ No remote origin found. Please add your GitHub repo:" -ForegroundColor Red
    Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Yellow
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Cyan

# Add all files
Write-Host "📁 Adding files..." -ForegroundColor Yellow
git add .

# Commit changes
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Trigger SOFLOTTO contract build - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push origin $currentBranch

Write-Host ""
Write-Host "✅ SUCCESS! Build triggered on GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Go to your GitHub repository" -ForegroundColor White
Write-Host "   2. Click 'Actions' tab" -ForegroundColor White
Write-Host "   3. Watch 'Build Solana Smart Contracts' workflow" -ForegroundColor White
Write-Host "   4. Download build artifacts when complete" -ForegroundColor White
Write-Host "   5. Extract to project root and run: npm run deploy:simple" -ForegroundColor White
Write-Host ""
Write-Host "⏱️  Build time: ~5-10 minutes" -ForegroundColor Yellow
Write-Host "🔗 GitHub Actions: $remote/actions" -ForegroundColor Blue
