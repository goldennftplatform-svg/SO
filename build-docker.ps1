# Docker Build Script for SOFLOTTO
Write-Host "🐳 Building SOFLOTTO contracts with Docker" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Build the Docker image
Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
docker build -t soflotto-builder .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully!" -ForegroundColor Green

# Run the build
Write-Host "🚀 Building contracts..." -ForegroundColor Yellow
docker run --rm -v ${PWD}:/app soflotto-builder

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Contract build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 SUCCESS! Contracts built successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Generated files:" -ForegroundColor Cyan
Write-Host "   - target/ (built contracts)" -ForegroundColor White
Write-Host "   - .anchor/ (IDL files)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next step: npm run deploy:simple" -ForegroundColor Yellow
