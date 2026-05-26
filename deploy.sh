#!/bin/bash

# GridPlay Deployment Script
# Deploys to Vercel

echo "🚀 Deploying GridPlay to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "📤 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Deployment complete!"
echo "📍 Your app should be live at: https://gridplay.vercel.app"
