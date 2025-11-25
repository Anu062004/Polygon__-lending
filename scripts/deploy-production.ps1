# Production Deployment Script for Debpol Protocol (Windows)
param(
    [string]$Environment = "production"
)

Write-Host "🚀 Starting Production Deployment..." -ForegroundColor Green

# Check if required environment variables are set
if (-not $env:POLYGON_AMOY_DEPLOYER_KEY) {
    Write-Host "❌ Error: POLYGON_AMOY_DEPLOYER_KEY is not set" -ForegroundColor Red
    exit 1
}

if (-not $env:POLYGONSCAN_API_KEY) {
    Write-Host "❌ Error: POLYGONSCAN_API_KEY is not set" -ForegroundColor Red
    exit 1
}

# Load production environment
Write-Host "📋 Loading production environment..." -ForegroundColor Yellow
Copy-Item env.production .env

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci

# Compile contracts
Write-Host "🔨 Compiling smart contracts..." -ForegroundColor Yellow
npx hardhat compile

# Run tests
Write-Host "🧪 Running test suite..." -ForegroundColor Yellow
npm test

# Deploy to Polygon Amoy
Write-Host "🌐 Deploying to Polygon Amoy..." -ForegroundColor Yellow
npm run deploy:amoy

# Verify contracts
Write-Host "✅ Verifying contracts on Polygonscan..." -ForegroundColor Yellow
npm run verify:amoy

# Build frontend
Write-Host "🏗️ Building frontend..." -ForegroundColor Yellow
Set-Location app
npm ci
npm run build
Set-Location ..

# Start production services
Write-Host "🐳 Starting production services..." -ForegroundColor Yellow
docker-compose up -d

# Health check
Write-Host "🏥 Performing health checks..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check if services are running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is running on http://localhost:3000" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend health check failed" -ForegroundColor Red
    exit 1
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Prometheus is running on http://localhost:9090" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Prometheus health check failed" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Grafana is running on http://localhost:3001" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Grafana health check failed" -ForegroundColor Red
}

Write-Host "🎉 Production deployment completed successfully!" -ForegroundColor Green
Write-Host "📊 Access your services:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Grafana: http://localhost:3001 (admin/admin123)" -ForegroundColor White
Write-Host "   Prometheus: http://localhost:9090" -ForegroundColor White


