# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `pnpm dev` - Start development server on localhost:5173
- `pnpm build` - Build production application
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run ESLint code linting
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once (CI mode)
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:ui` - Run tests with visual UI interface

### Testing Commands
- `pnpm test:watch` - Run tests in watch mode (same as `pnpm test`)
- Use Vitest for testing framework with React Testing Library
- Test files are located in `src/__tests__/` and `src/components/__tests__/`
- Always run tests before making changes to ensure nothing breaks

### Deployment Commands
- `pnpm deploy` - Main deployment script (scripts/deploy.sh)
- `pnpm deploy:git` - Deploy using Git (scripts/deploy-git.sh)
- `pnpm deploy:vercel` - Deploy to Vercel (scripts/deploy-vercel.sh)
- `pnpm deploy:netlify` - Deploy to Netlify (scripts/deploy-netlify.sh)
- `pnpm deploy:quick` - Quick deployment option (scripts/quick-deploy.sh)

## File Organization

The project is organized into logical directories:
- **docs/**: All documentation files including this CLAUDE.md
- **database/**: Database schema files (use PRODUCTION version for production)
- **scripts/**: Deployment and setup scripts
- **src/**: Application source code with standard React structure

### Authentication Setup
The application now includes comprehensive authentication:
- **Run auth schema**: `database/AUTH_USER_MANAGEMENT_SCHEMA.sql` in Supabase
- **Set environment variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Create admin user**: After first registration, run `SELECT jetagritracker.create_admin_user('email');`
- **See full guide**: `docs/AUTHENTICATION_GUIDE.md`

## Architecture Overview

### Tech Stack
- **Frontend**: React 18.3.1 + TypeScript + Vite
- **Database**: Supabase (PostgreSQL) with offline-first approach
- **Styling**: Tailwind CSS with glassmorphism design
- **Charts**: Chart.js + react-chartjs-2
- **Testing**: Vitest + React Testing Library
- **Package Manager**: pnpm

### Data Architecture
The application uses a dual-layer data architecture:
1. **Local Storage**: Primary data persistence for offline-first functionality
2. **Supabase**: Cloud synchronization when online

### Core Data Models
- **Farmer**: Agricultural producer with personal and farm information
- **Land**: Farm parcels with location and soil data
- **Crop**: Crop lifecycle tracking from planting to harvest
- **Transaction**: Financial transactions for sales and purchases

### Database Schema
- Uses PostgreSQL with `jetagritracker` schema (lowercase)
- Tables: `farmers`, `lands`, `crops`, `transactions`
- UUID primary keys with `gen_random_uuid()`
- Row Level Security (RLS) enabled for multi-user support
- Camel case in frontend transforms to snake_case in database

### Offline-First Design
The application works without internet connection:
- All data operations work locally via localStorage
- Offline actions are queued and synced when online
- Temporary IDs are generated for offline records
- Sync conflicts are handled gracefully

### Component Structure
- **Modular Design**: Each feature has its own manager component
- **Responsive UI**: Mobile-first design with bottom navigation
- **State Management**: React hooks with local state
- **Error Boundaries**: Comprehensive error handling
- **Theme Support**: Light/dark theme switching

### Key Utilities
- `src/utils/supabase.ts` - Database operations with offline support
- `src/utils/sync.ts` - Data synchronization logic
- `src/types/index.ts` - TypeScript interfaces for all data models

### Testing Strategy
- **Unit Tests**: All utility functions and components
- **Integration Tests**: Full CRUD workflows
- **Responsive Tests**: Mobile and desktop viewports
- **Error Handling**: Edge cases and offline scenarios
- Test setup uses jsdom environment with global test utilities

### Environment Configuration
- Supabase credentials via environment variables only
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- No UI configuration - security-focused approach
- Automatic fallback to offline mode when not configured

### Development Notes
- Always run `pnpm lint` before committing changes
- Test coverage is important - aim for comprehensive coverage
- Follow TypeScript strict mode requirements
- Use existing patterns for new components
- Maintain offline-first functionality in all features