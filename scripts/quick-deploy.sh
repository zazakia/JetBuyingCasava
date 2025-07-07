#!/bin/bash

# Quick Deploy Script for AgriTracker Pro
# Simple one-command deployment to all platforms

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

main() {
    clear
    echo "🚀 Quick Deploy - AgriTracker Pro"
    echo "================================="
    echo ""
    
    # Get commit message
    read -p "Enter commit message [Quick deploy $(date '+%Y-%m-%d %H:%M:%S')]: " commit_message
    commit_message="${commit_message:-Quick deploy $(date '+%Y-%m-%d %H:%M:%S')}"
    
    # Build
    print_status "Building project..."
    npm run build
    
    # Git
    print_status "Deploying to Git..."
    git add .
    git commit -m "$commit_message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    git push origin main
    
    # Vercel
    print_status "Deploying to Vercel..."
    npx vercel --prod --yes
    
    print_success "🎉 Deployment completed!"
    echo ""
    print_status "Deployed to:"
    echo "  ✅ Git repository"
    echo "  ✅ Vercel production"
    echo ""
}

main "$@"