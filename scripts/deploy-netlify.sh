#!/bin/bash

# Netlify Deployment Script for AgriTracker Pro
# Builds and deploys the application to Netlify

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

# Install Netlify CLI if not present
install_netlify_cli() {
    if ! command_exists netlify; then
        print_warning "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
        print_success "Netlify CLI installed successfully!"
    fi
}

# Check Netlify authentication
check_netlify_auth() {
    print_status "Checking Netlify authentication..."
    
    if ! netlify status > /dev/null 2>&1; then
        print_warning "Not authenticated with Netlify. Please log in."
        netlify login
        
        if ! netlify status > /dev/null 2>&1; then
            print_error "Failed to authenticate with Netlify."
            exit 1
        fi
    fi
    
    print_success "Netlify authentication verified!"
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

# Create netlify.toml if it doesn't exist
create_netlify_config() {
    if [ ! -f "netlify.toml" ]; then
        print_status "Creating netlify.toml configuration..."
        cat > netlify.toml << EOF
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[dev]
  command = "npm run dev"
  port = 5173
  publish = "dist"
EOF
        print_success "netlify.toml created successfully!"
    fi
}

# Main function
main() {
    print_status "🌐 AgriTracker Pro - Netlify Deployment"
    echo "======================================="
    
    # Parse arguments
    SKIP_BUILD=false
    PRODUCTION=true
    SITE_ID=""
    
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
            --site-id)
                SITE_ID="$2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-build       Skip the build step"
                echo "  --preview          Deploy as preview (not production)"
                echo "  --site-id ID       Specify Netlify site ID"
                echo "  -h, --help         Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                 # Build and deploy to production"
                echo "  $0 --preview       # Deploy as preview"
                echo "  $0 --skip-build    # Deploy without building"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                print_status "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Install Netlify CLI if needed
    install_netlify_cli
    
    # Check authentication
    check_netlify_auth
    
    # Create configuration if needed
    create_netlify_config
    
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
    
    # Deploy to Netlify
    if [ "$PRODUCTION" = true ]; then
        print_status "Deploying to Netlify production..."
        if [ -n "$SITE_ID" ]; then
            deployment_cmd="netlify deploy --prod --dir=dist --site=$SITE_ID"
        else
            deployment_cmd="netlify deploy --prod --dir=dist"
        fi
    else
        print_status "Deploying to Netlify preview..."
        if [ -n "$SITE_ID" ]; then
            deployment_cmd="netlify deploy --dir=dist --site=$SITE_ID"
        else
            deployment_cmd="netlify deploy --dir=dist"
        fi
    fi
    
    print_status "Running: $deployment_cmd"
    
    if $deployment_cmd; then
        print_success "Successfully deployed to Netlify!"
        
        # Show site information
        print_status "Getting site information..."
        netlify status 2>/dev/null || true
        
        echo ""
        print_status "Useful Netlify commands:"
        echo "  • netlify open      # Open your site in browser"
        echo "  • netlify status    # Show site status"
        echo "  • netlify logs      # View function logs"
        echo "  • netlify env:list  # List environment variables"
        echo ""
        
        print_status "Next steps:"
        echo "  • Verify the deployment is working correctly"
        echo "  • Check environment variables in Netlify dashboard"
        echo "  • Set up custom domain if needed"
        echo ""
    else
        print_error "Failed to deploy to Netlify."
        print_status "Troubleshooting tips:"
        echo "  • Check your internet connection"
        echo "  • Verify Netlify authentication: netlify status"
        echo "  • Check site configuration: netlify.toml"
        echo "  • Review build logs for errors"
        exit 1
    fi
}

main "$@"