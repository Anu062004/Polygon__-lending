#!/bin/bash

# Production Deployment Script for Debpol Protocol
set -e

echo "🚀 Starting Production Deployment..."

# Check if required environment variables are set
if [ -z "$POLYGON_AMOY_DEPLOYER_KEY" ]; then
    echo "❌ Error: POLYGON_AMOY_DEPLOYER_KEY is not set"
    exit 1
fi

if [ -z "$POLYGONSCAN_API_KEY" ]; then
    echo "❌ Error: POLYGONSCAN_API_KEY is not set"
    exit 1
fi

# Load production environment
echo "📋 Loading production environment..."
cp env.production .env

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Compile contracts
echo "🔨 Compiling smart contracts..."
npx hardhat compile

# Run tests
echo "🧪 Running test suite..."
npm test

# Deploy to Polygon Amoy
echo "🌐 Deploying to Polygon Amoy..."
npm run deploy:amoy

# Verify contracts
echo "✅ Verifying contracts on Polygonscan..."
npm run verify:amoy

# Build frontend
echo "🏗️ Building frontend..."
cd app
npm ci
npm run build
cd ..

# Start production services
echo "🐳 Starting production services..."
docker-compose up -d

# Health check
echo "🏥 Performing health checks..."
sleep 30

# Check if services are running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

if curl -f http://localhost:9090 > /dev/null 2>&1; then
    echo "✅ Prometheus is running on http://localhost:9090"
else
    echo "❌ Prometheus health check failed"
fi

if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Grafana is running on http://localhost:3001"
else
    echo "❌ Grafana health check failed"
fi

echo "🎉 Production deployment completed successfully!"
echo "📊 Access your services:"
echo "   Frontend: http://localhost:3000"
echo "   Grafana: http://localhost:3001 (admin/admin123)"
echo "   Prometheus: http://localhost:9090"


