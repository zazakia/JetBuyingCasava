#!/bin/bash

# Git Deployment Script for AgriTracker Pro
# Commits changes and pushes to Git repository

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get user input for commit message
get_commit_message() {
    local default_message="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    read -p "Enter commit message [$default_message]: " commit_message
    echo "${commit_message:-$default_message}"
}

# Main function
main() {
    print_status "🌾 AgriTracker Pro - Git Deployment"
    echo "======================================"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not a git repository. Please initialize git first."
        exit 1
    fi
    
    # Check git status
    print_status "Checking git status..."
    git status --porcelain
    
    # Check if there are changes to commit
    if git diff-index --quiet HEAD --; then
        print_warning "No changes to commit."
        read -p "Do you want to push anyway? (y/N): " push_anyway
        if [[ ! "$push_anyway" =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled."
            exit 0
        fi
    else
        # Get commit message
        commit_message=$(get_commit_message)
        
        # Stage all changes
        print_status "Staging all changes..."
        git add .
        
        # Show what will be committed
        print_status "Changes to be committed:"
        git diff --cached --stat
        
        # Confirm commit
        read -p "Proceed with commit? (Y/n): " confirm_commit
        if [[ "$confirm_commit" =~ ^[Nn]$ ]]; then
            print_status "Deployment cancelled."
            exit 0
        fi
        
        # Commit changes
        print_status "Committing changes..."
        git commit -m "$commit_message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
        
        print_success "Changes committed successfully!"
    fi
    
    # Get current branch
    current_branch=$(git branch --show-current)
    print_status "Current branch: $current_branch"
    
    # Push to origin
    print_status "Pushing to origin/$current_branch..."
    if git push origin "$current_branch"; then
        print_success "Successfully pushed to Git repository!"
        
        # Show remote URL
        remote_url=$(git remote get-url origin 2>/dev/null || echo "Not configured")
        print_status "Repository URL: $remote_url"
    else
        print_error "Failed to push to Git repository."
        exit 1
    fi
}

main "$@"