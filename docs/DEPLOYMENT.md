# 🚀 Deployment Guide - AgriTracker Pro

This guide covers all deployment options for the AgriTracker Pro farmers management system.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Deployment Scripts](#deployment-scripts)
- [Platform-Specific Deployment](#platform-specific-deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

The fastest way to deploy to all platforms:

```bash
# Quick deploy to Git + Vercel
npm run deploy:quick

# Full deployment to all platforms
npm run deploy
```

## 📋 Prerequisites

### Required Tools

1. **Node.js** (v18 or higher)
2. **Git** (configured with your repository)
3. **npm** or **pnpm**

### Platform CLI Tools (Auto-installed by scripts)

- **Vercel CLI**: `npm install -g vercel`
- **Netlify CLI**: `npm install -g netlify-cli`

### Authentication

Make sure you're authenticated with your deployment platforms:

```bash
# Vercel
vercel login

# Netlify
netlify login
```

## 🛠 Deployment Scripts

### Main Deployment Script

**File**: `./deploy.sh`

Comprehensive deployment to all platforms with options:

```bash
# Deploy to all platforms
./deploy.sh

# Deploy only to specific platforms
./deploy.sh --vercel-only
./deploy.sh --netlify-only
./deploy.sh --git-only

# Skip certain platforms
./deploy.sh --skip-netlify
./deploy.sh --skip-vercel
./deploy.sh --skip-git

# Skip build step
./deploy.sh --skip-build

# Show help
./deploy.sh --help
```

### NPM Scripts

```bash
# Main deployment (all platforms)
npm run deploy

# Platform-specific deployments
npm run deploy:git      # Git only
npm run deploy:vercel   # Vercel only
npm run deploy:netlify  # Netlify only

# Quick deploy (Git + Vercel)
npm run deploy:quick
```

### Individual Scripts

#### Git Deployment
**File**: `./scripts/deploy-git.sh`

```bash
# Deploy to Git repository
./scripts/deploy-git.sh
npm run deploy:git
```

Features:
- ✅ Automatic staging of changes
- ✅ Interactive commit message input
- ✅ Branch detection and push
- ✅ Status verification

#### Vercel Deployment
**File**: `./scripts/deploy-vercel.sh`

```bash
# Deploy to Vercel production
./scripts/deploy-vercel.sh
npm run deploy:vercel

# Deploy as preview
./scripts/deploy-vercel.sh --preview

# Skip build step
./scripts/deploy-vercel.sh --skip-build
```

Features:
- ✅ Auto-installs Vercel CLI if needed
- ✅ Production and preview modes
- ✅ Build verification
- ✅ Deployment URL display

#### Netlify Deployment
**File**: `./scripts/deploy-netlify.sh`

```bash
# Deploy to Netlify production
./scripts/deploy-netlify.sh
npm run deploy:netlify

# Deploy as preview
./scripts/deploy-netlify.sh --preview

# Specify site ID
./scripts/deploy-netlify.sh --site-id your-site-id
```

Features:
- ✅ Auto-installs Netlify CLI if needed
- ✅ Authentication verification
- ✅ Auto-creates `netlify.toml` config
- ✅ Production and preview modes

## 🌐 Platform-Specific Deployment

### Vercel Deployment

**Automatic Deployment** (Recommended):
1. Connect your Git repository to Vercel
2. Vercel will auto-deploy on every push to main branch

**Manual Deployment**:
```bash
npm run deploy:vercel
```

**Environment Variables**:
Add these in your Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Netlify Deployment

**Automatic Deployment** (Recommended):
1. Connect your Git repository to Netlify
2. Netlify will auto-deploy using `netlify.toml` configuration

**Manual Deployment**:
```bash
npm run deploy:netlify
```

**Build Configuration**:
The included `netlify.toml` handles:
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist`
- ✅ SPA routing redirects
- ✅ Security headers
- ✅ Asset caching

### Git Deployment

```bash
npm run deploy:git
```

This will:
1. Stage all changes
2. Prompt for commit message
3. Commit with standardized format
4. Push to the current branch

## 🔐 Environment Variables

### Required Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Platform Setup

**Vercel**:
1. Go to your project dashboard
2. Navigate to Settings > Environment Variables
3. Add the variables above

**Netlify**:
1. Go to your site dashboard
2. Navigate to Site settings > Environment variables
3. Add the variables above

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check for TypeScript errors
npm run lint

# Run tests
npm run test

# Try building locally
npm run build
```

#### Authentication Issues

**Vercel**:
```bash
# Check authentication
vercel whoami

# Re-authenticate
vercel login
```

**Netlify**:
```bash
# Check authentication
netlify status

# Re-authenticate
netlify login
```

#### Git Issues
```bash
# Check git status
git status

# Check remote URL
git remote -v

# Fix common issues
git pull origin main  # Pull latest changes
git push --set-upstream origin main  # Set upstream
```

#### Permission Issues
```bash
# Make scripts executable
chmod +x deploy.sh scripts/*.sh

# Or run with bash
bash deploy.sh
```

### Environment Variable Issues

1. **Variables not loading**: Check variable names start with `VITE_`
2. **Supabase connection fails**: Verify URL and API key format
3. **Build-time vs Runtime**: Vite variables are build-time only

### Platform-Specific Issues

**Vercel**:
- Function timeout issues: Check Vercel function limits
- Build timeout: Optimize build process or upgrade plan
- Domain issues: Configure custom domains in dashboard

**Netlify**:
- Redirect loops: Check `netlify.toml` redirects
- Form handling: Use Netlify forms for contact forms
- Function issues: Check Netlify functions documentation

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Documentation](https://supabase.com/docs)

## 🎯 Best Practices

1. **Always test locally** before deploying
2. **Use environment variables** for sensitive data
3. **Set up automatic deployments** for production workflows
4. **Monitor deployments** for errors and performance
5. **Keep dependencies updated** for security
6. **Use staging environments** for testing major changes

---

*Generated by AgriTracker Pro deployment automation* 🌾