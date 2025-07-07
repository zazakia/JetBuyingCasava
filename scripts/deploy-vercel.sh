#!/bin/bash

# Vercel Deployment Script for AgriTracker Pro
# Builds and deploys the application to Vercel

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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Vercel CLI if not present
install_vercel_cli() {
    if ! command_exists vercel; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
        print_success "Vercel CLI installed successfully!"
    fi
}

# Build the project
build_project() {
    print_status "Building the project..."
    
    if npm run build; then
        print_success "Build completed successfully!"
    else
        print_error "Build failed. Please fix errors before deploying."
        exit 1
    fi
}

# Main function
main() {
    print_status "🚀 AgriTracker Pro - Vercel Deployment"
    echo "======================================="
    
    # Parse arguments
    SKIP_BUILD=false
    PRODUCTION=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --preview)
                PRODUCTION=false
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-build    Skip the build step"
                echo "  --preview       Deploy as preview (not production)"
                echo "  -h, --help      Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0              # Build and deploy to production"
                echo "  $0 --preview    # Deploy as preview"
                echo "  $0 --skip-build # Deploy without building"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                print_status "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Install Vercel CLI if needed
    install_vercel_cli
    
    # Build project (unless skipped)
    if [ "$SKIP_BUILD" = false ]; then
        build_project
    else
        print_warning "Skipping build as requested"
    fi
    
    # Check if dist directory exists
    if [ ! -d "dist" ]; then
        print_error "dist directory not found. Please run build first."
        exit 1
    fi
    
    # Deploy to Vercel
    if [ "$PRODUCTION" = true ]; then
        print_status "Deploying to Vercel production..."
        deployment_cmd="vercel --prod --yes"
    else
        print_status "Deploying to Vercel preview..."
        deployment_cmd="vercel --yes"
    fi
    
    print_status "Running: $deployment_cmd"
    
    if $deployment_cmd; then
        print_success "Successfully deployed to Vercel!"
        
        # Get deployment URL
        print_status "Getting deployment information..."
        vercel ls --limit 1 2>/dev/null || true
        
        echo ""
        print_status "Next steps:"
        echo "  • Verify the deployment is working correctly"
        echo "  • Check environment variables in Vercel dashboard"
        echo "  • Run 'vercel --help' for more commands"
        echo ""
    else
        print_error "Failed to deploy to Vercel."
        print_status "Troubleshooting tips:"
        echo "  • Check your internet connection"
        echo "  • Verify Vercel authentication: vercel whoami"
        echo "  • Check project configuration: vercel.json"
        echo "  • Review build logs for errors"
        exit 1
    fi
}

main "$@"