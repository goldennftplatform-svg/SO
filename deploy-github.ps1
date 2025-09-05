# Deploy SOFLOTTO to GitHub Actions (ACTUAL 10-minute solution)
Write-Host "Setting up GitHub Actions deployment..." -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial SOFLOTTO commit"
}

# Check if remote exists
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "Please create a GitHub repository and run:" -ForegroundColor Red
    Write-Host "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Yellow
    Write-Host "Then run this script again" -ForegroundColor Yellow
    exit 1
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git add .
git commit -m "Update SOFLOTTO contracts"
git push origin main

Write-Host "Build triggered! Check GitHub Actions tab for progress." -ForegroundColor Green
Write-Host "Your contracts will be built in the cloud and ready for download." -ForegroundColor Green
