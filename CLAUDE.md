# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `pnpm dev` - Start development server on localhost:5173
- `pnpm build` - Build production application (includes TypeScript compilation)
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run ESLint code linting
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once (CI mode)
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:ui` - Run tests with visual UI interface via Vitest

### Admin Setup
- `pnpm create-admin` - Create admin user via scripts/create-admin.js

### Test Commands
- Use Vitest for testing framework with React Testing Library
- Test files in `src/__tests__/` and `src/components/__tests__/`
- Always run `pnpm lint` and `pnpm build` before committing

## Architecture Overview

### Tech Stack
- **Frontend**: React 18.3.1 + TypeScript + Vite
- **Database**: Supabase (PostgreSQL) with offline-first approach
- **Styling**: Tailwind CSS with glassmorphism design
- **Charts**: Chart.js + react-chartjs-2
- **Testing**: Vitest + React Testing Library + jsdom
- **Package Manager**: pnpm

### Data Architecture
Dual-layer data architecture:
1. **Local Storage**: Primary data persistence for offline-first functionality
2. **Supabase**: Cloud synchronization when online

### Core Data Models
- **Farmer**: Agricultural producer profiles with personal and farm information
- **Land**: Farm parcels with location, soil type, and coordinates
- **Crop**: Crop lifecycle tracking from planting to harvest with status
- **Transaction**: Financial transactions for sales/purchases with payment tracking

### Database Schema
- PostgreSQL with `jetagritracker` schema (lowercase)
- Tables: `farmers`, `lands`, `crops`, `transactions`
- UUID primary keys with `gen_random_uuid()`
- Row Level Security (RLS) enabled for authentication
- Camel case in frontend transforms to snake_case in database

### Authentication System
- Supabase Auth with custom user profiles
- Role-based access: 'admin' | 'manager' | 'user'
- Email verification required
- Password reset functionality
- Custom user profiles in `jetagritracker.user_profiles` table

### Offline-First Design
- All data operations work locally via localStorage
- Offline actions queued and synced when online
- Temporary IDs generated for offline records (format: `temp_${timestamp}_${random}`)
- Sync conflicts handled gracefully with error reporting
- Connection status monitoring

### Component Architecture
- **Modular Design**: Each feature has its own manager component
- **Responsive UI**: Mobile-first with bottom navigation for small screens
- **State Management**: React Context (AuthContext, ThemeContext) + local state
- **Error Boundaries**: Comprehensive error handling with ErrorBoundary component
- **Theme Support**: Light/dark theme switching via ThemeContext

### Key Utilities
- `src/utils/supabase.ts` - Database operations with offline support and data transformation
- `src/utils/sync.ts` - Data synchronization logic
- `src/utils/userProfile.ts` - User profile management
- `src/types/index.ts` - TypeScript interfaces for all data models

### Environment Configuration
- Environment variables only: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Automatic fallback to offline mode when Supabase not configured
- Connection validation on startup

### Testing Strategy
- **Unit Tests**: All utility functions and components
- **Integration Tests**: Full CRUD workflows
- **Responsive Tests**: Mobile (320px+) and desktop (1024px+) viewports
- **Error Handling**: Edge cases and offline scenarios
- **Mocking**: Supabase client mocked for testing

### Build Configuration
- Vite with React plugin
- Manual chunk splitting for vendor, charts, supabase, and utils
- Optimized dependencies exclude lucide-react
- TypeScript strict mode enabled
- Tailwind CSS with PostCSS

### Code Style and Patterns
- TypeScript strict mode with full type coverage
- Functional components with hooks
- Custom hooks for data operations
- Consistent error handling patterns
- Responsive design with mobile-first approach
- Component composition over inheritance