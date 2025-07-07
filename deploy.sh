#!/bin/bash

# AgriTracker Pro - Complete Deployment Script
# This script deploys to Git, Vercel, and Netlify

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for user input
prompt_user() {
    local prompt_message="$1"
    local default_value="$2"
    local user_input
    
    if [ -n "$default_value" ]; then
        read -p "$prompt_message [$default_value]: " user_input
        echo "${user_input:-$default_value}"
    else
        read -p "$prompt_message: " user_input
        echo "$user_input"
    fi
}

# Function to check git status
check_git_status() {
    print_status "Checking git status..."
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not a git repository. Please initialize git first."
        exit 1
    fi
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes."
        return 1
    fi
    
    return 0
}

# Function to build the project
build_project() {
    print_status "Building the project..."
    
    if ! npm run build; then
        print_error "Build failed. Please fix errors before deploying."
        exit 1
    fi
    
    print_success "Build completed successfully!"
}

# Function to deploy to Git
deploy_git() {
    print_status "Deploying to Git repository..."
    
    # Check for uncommitted changes and commit if necessary
    if ! check_git_status; then
        local commit_message
        commit_message=$(prompt_user "Enter commit message" "Deploy: $(date '+%Y-%m-%d %H:%M:%S')")
        
        print_status "Staging all changes..."
        git add .
        
        print_status "Committing changes..."
        git commit -m "$commit_message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    fi
    
    # Push to origin
    local current_branch
    current_branch=$(git branch --show-current)
    
    print_status "Pushing to origin/$current_branch..."
    if git push origin "$current_branch"; then
        print_success "Successfully pushed to Git repository!"
    else
        print_error "Failed to push to Git repository."
        return 1
    fi
}

# Function to deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command_exists vercel; then
        print_error "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy to production
    print_status "Deploying to Vercel production..."
    if vercel --prod --yes; then
        print_success "Successfully deployed to Vercel!"
    else
        print_error "Failed to deploy to Vercel."
        return 1
    fi
}

# Function to deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    if ! command_exists netlify; then
        print_error "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi
    
    # Check if user is logged in to Netlify
    if ! netlify status > /dev/null 2>&1; then
        print_warning "Not logged in to Netlify. Please log in first."
        netlify login
    fi
    
    # Deploy to production
    print_status "Deploying to Netlify production..."
    if netlify deploy --prod --dir=dist; then
        print_success "Successfully deployed to Netlify!"
    else
        print_error "Failed to deploy to Netlify."
        return 1
    fi
}

# Function to show deployment URLs
show_deployment_info() {
    echo ""
    print_success "🚀 Deployment completed successfully!"
    echo ""
    print_status "Deployment Information:"
    echo "  📁 Git Repository: $(git remote get-url origin 2>/dev/null || echo 'Not configured')"
    echo "  🔗 Vercel: Run 'vercel --help' to get deployment URL"
    echo "  🌐 Netlify: Run 'netlify open' to view your site"
    echo ""
    print_status "Next steps:"
    echo "  • Verify deployments are working correctly"
    echo "  • Check environment variables are set on hosting platforms"
    echo "  • Monitor for any deployment issues"
    echo ""
}

# Main deployment function
main() {
    clear
    echo "=================================================="
    echo "  🌾 AgriTracker Pro - Deployment Script 🌱"
    echo "=================================================="
    echo ""
    
    print_status "Starting deployment process..."
    
    # Parse command line arguments
    DEPLOY_GIT=true
    DEPLOY_VERCEL=true
    DEPLOY_NETLIFY=true
    SKIP_BUILD=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-git)
                DEPLOY_GIT=false
                shift
                ;;
            --skip-vercel)
                DEPLOY_VERCEL=false
                shift
                ;;
            --skip-netlify)
                DEPLOY_NETLIFY=false
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --git-only)
                DEPLOY_VERCEL=false
                DEPLOY_NETLIFY=false
                shift
                ;;
            --vercel-only)
                DEPLOY_GIT=false
                DEPLOY_NETLIFY=false
                shift
                ;;
            --netlify-only)
                DEPLOY_GIT=false
                DEPLOY_VERCEL=false
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-git       Skip Git deployment"
                echo "  --skip-vercel    Skip Vercel deployment"
                echo "  --skip-netlify   Skip Netlify deployment"
                echo "  --skip-build     Skip project build"
                echo "  --git-only       Deploy only to Git"
                echo "  --vercel-only    Deploy only to Vercel"
                echo "  --netlify-only   Deploy only to Netlify"
                echo "  -h, --help       Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                    # Deploy to all platforms"
                echo "  $0 --vercel-only     # Deploy only to Vercel"
                echo "  $0 --skip-netlify    # Deploy to Git and Vercel only"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                print_status "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Build the project (unless skipped)
    if [ "$SKIP_BUILD" = false ]; then
        build_project
    else
        print_warning "Skipping build as requested"
    fi
    
    # Deploy to platforms
    local deployment_failed=false
    
    if [ "$DEPLOY_GIT" = true ]; then
        if ! deploy_git; then
            deployment_failed=true
        fi
    fi
    
    if [ "$DEPLOY_VERCEL" = true ]; then
        if ! deploy_vercel; then
            deployment_failed=true
        fi
    fi
    
    if [ "$DEPLOY_NETLIFY" = true ]; then
        if ! deploy_netlify; then
            deployment_failed=true
        fi
    fi
    
    # Show results
    if [ "$deployment_failed" = true ]; then
        print_error "Some deployments failed. Please check the output above."
        exit 1
    else
        show_deployment_info
    fi
}

# Run the main function with all arguments
main "$@"